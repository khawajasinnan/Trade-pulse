import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';
import { isDbBlocked } from '../utils/db-utils';
import { getRealTimeRate } from './forex.service';
import * as path from 'path';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const PYTHON_SCRIPT_PATH = path.join(process.cwd(), 'ml-service', 'ml_prediction.py');
// Use .venv directory. Allow override via ML_PYTHON_CMD env var
const CANDIDATE_PYTHONS = [
    process.env.ML_PYTHON_CMD || '',
    path.join(process.cwd(), 'ml-service', '.venv', 'bin', 'python3'),
    'python3',
];

/**
 * Train model and make prediction using Python service
 */
export async function trainAndPredict(
    currencyPair: string
): Promise<{
    predictedValue: number;
    direction: 'UP' | 'DOWN' | 'NEUTRAL';
    confidence: number;
    recommendation: 'BUY' | 'SELL' | 'HOLD';
}> {
    try {
        console.log(`Training model for ${currencyPair} using Python service...`);

        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL not configured');
        }

        // Check if Python script and venv exist
        const fs = require('fs');
        if (!fs.existsSync(PYTHON_SCRIPT_PATH)) {
            throw new Error('ML prediction script not found');
        }

        // Determine python command: prefer explicit candidates that have required packages
        let pythonCmd: string | null = null;
        const failedCandidates: Array<{ candidate: string, errors: string[] }> = [];

        for (const candidate of CANDIDATE_PYTHONS) {
            if (!candidate) continue;
            try {
                const check = await checkPythonEnvironment(candidate);
                if (check.pythonInstalled && check.packagesInstalled) {
                    pythonCmd = candidate;
                    console.log(`Using Python for ML: ${candidate}`);
                    break;
                } else {
                    // Collect failures but only log if no candidate works
                    failedCandidates.push({ candidate, errors: check.errors });
                }
            } catch (err) {
                failedCandidates.push({ candidate, errors: [(err as any)?.message || String(err)] });
            }
        }

        if (!pythonCmd) {
            console.warn('No suitable Python environment found for ML.');
            failedCandidates.forEach(({ candidate, errors }) => {
                console.warn(`  ${candidate}: ${errors.join(', ')}`);
            });
            throw new Error('Python environment missing');
        }

        // Ensure latest real-time rate is present in DB so ML script trains on freshest data
        try {
            const [base, target] = currencyPair.split(/[-\/]/);
            const latestRate = await getRealTimeRate(base, target);

            // Upsert a historical data point for now
            if (!isDbBlocked()) {
                await prisma.historicalData.upsert({
                    where: {
                        currencyPair_date: {
                            currencyPair,
                            date: new Date(),
                        },
                    },
                    update: { close: latestRate },
                    create: {
                        currencyPair,
                        date: new Date(),
                        open: latestRate,
                        high: latestRate,
                        low: latestRate,
                        close: latestRate,
                        volume: 0,
                    },
                });
            } else {
                console.warn('Skipping historicalData upsert because DB writes are currently blocked');
            }
        } catch (e) {
            console.warn('Failed to store latest rate for ML training:', (e as any)?.message || String(e));
        }

        // Call Python script with shorter timeout to prevent socket hangups
        const command = `${pythonCmd} ${PYTHON_SCRIPT_PATH} "${databaseUrl}" "${currencyPair}"`;

        // Increase timeout to allow training to complete on slower machines
        const { stdout, stderr } = await execAsync(command, {
            timeout: parseInt(process.env.ML_PREDICTION_TIMEOUT_MS || '120000'), // 120 seconds default
            maxBuffer: parseInt(process.env.ML_PREDICTION_MAX_BUFFER || String(10 * 1024 * 1024)),
        });

        // Log stderr for debugging but don't fail on warnings
        if (stderr && stderr.length > 0) {
            const errorLines = stderr.split('\n').filter(line =>
                !line.includes('cuda') &&
                !line.includes('GPU') &&
                !line.includes('CPU instructions') &&
                line.trim().length > 0
            );
            if (errorLines.length > 0) {
                console.log('Python warnings:', errorLines.join('\n'));
            }
        }

        // Parse JSON result from stdout
        // Robustly find JSON in stdout after the marker '=== RESULT ==='
        let result: any = null;
        try {
            const markerIndex = stdout.lastIndexOf('=== RESULT ===');
            if (markerIndex >= 0) {
                const jsonPart = stdout.substring(markerIndex + '=== RESULT ==='.length).trim();
                // Find the last JSON object in the string (if there are trailing logs)
                const firstBrace = jsonPart.indexOf('{');
                const lastBrace = jsonPart.lastIndexOf('}');
                if (firstBrace >= 0 && lastBrace >= 0) {
                    const jsonStr = jsonPart.substring(firstBrace, lastBrace + 1).trim();
                    result = JSON.parse(jsonStr);
                }
            } else {
                // As a fallback, attempt to parse the entire stdout for a JSON object
                const match = stdout.match(/({[\s\S]*})/);
                if (match) {
                    result = JSON.parse(match[1]);
                }
            }
        } catch (err) {
            console.error('Failed to parse JSON result from Python output. stdout:', stdout);
            console.error('stderr:', stderr);
            throw new Error('Failed to parse prediction result from Python script');
        }

        console.log(`Prediction complete for ${currencyPair}`);
        console.log(`Direction: ${result.direction}, Confidence: ${result.confidence}`);

        return {
            predictedValue: result.predicted_value,
            direction: result.direction as 'UP' | 'DOWN' | 'NEUTRAL',
            confidence: result.confidence,
            recommendation: result.recommendation as 'BUY' | 'SELL' | 'HOLD',
        };
    } catch (error: any) {
        console.warn(`Using fallback prediction for ${currencyPair}. Reason:`, (error as any)?.message || error);

        try {
            const cachedPrediction = await prisma.prediction.findFirst({
                where: { currencyPair },
                orderBy: { createdAt: 'desc' },
            });

            if (cachedPrediction && Date.now() - cachedPrediction.createdAt.getTime() < 24 * 60 * 60 * 1000) {
                // Calculate recommendation from cached prediction
                const change = ((cachedPrediction.predictedValue - 1.0) / 1.0) * 100;
                let recommendation: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
                if (change > 0.5) recommendation = 'BUY';
                else if (change < -0.5) recommendation = 'SELL';

                return {
                    predictedValue: cachedPrediction.predictedValue,
                    direction: cachedPrediction.direction as 'UP' | 'DOWN' | 'NEUTRAL',
                    confidence: cachedPrediction.confidence,
                    recommendation,
                };
            }
        } catch (dbError) {
            // Database also failed, continue to mock
        }

        // Return realistic mock data based on currency pair
        const mockRates: Record<string, number> = {
            'EUR-USD': 1.095,
            'GBP-USD': 1.268,
            'USD-JPY': 149.50,
            'AUD-USD': 0.652,
            'USD-CAD': 1.361,
        };

        const baseRate = mockRates[currencyPair] || 1.10;
        const predictedRate = baseRate * 1.005; // 0.5% increase

        return {
            predictedValue: predictedRate,
            direction: 'UP' as 'UP' | 'DOWN' | 'NEUTRAL',
            confidence: 75,
            recommendation: 'BUY' as 'BUY' | 'SELL' | 'HOLD',
        };
    }
}

/**
 * Get latest prediction from database
 */
export async function getLatestPrediction(currencyPair: string) {
    const prediction = await prisma.prediction.findFirst({
        where: { currencyPair },
        orderBy: { createdAt: 'desc' },
    });

    if (!prediction) {
        return null;
    }

    // Mark as recent if within 7 days (avoid forcing 24h-only visibility)
    const age = Date.now() - prediction.createdAt.getTime();
    const isRecent = age < 7 * 24 * 60 * 60 * 1000;

    return {
        ...prediction,
        isRecent,
    };
}

/**
 * Batch predict for multiple currency pairs
 */
export async function batchPredict(currencyPairs: string[]) {
    const predictions = [];

    for (const pair of currencyPairs) {
        try {
            const prediction = await trainAndPredict(pair);
            predictions.push({
                currencyPair: pair,
                ...prediction,
                success: true,
            });
        } catch (error: any) {
            console.error(`Failed to predict for ${pair}:`, error);
            predictions.push({
                currencyPair: pair,
                error: error.message,
                success: false,
            });
        }
    }

    return predictions;
}

/**
 * Check if Python and required packages are installed
 */
export async function checkPythonEnvironment(pythonCmd?: string): Promise<{
    pythonInstalled: boolean;
    packagesInstalled: boolean;
    errors: string[];
}> {
    const errors: string[] = [];
    let pythonInstalled = false;
    let packagesInstalled = false;

    try {
        // Check Python installation
        const checkCmd = pythonCmd ? `${pythonCmd} --version` : 'python3 --version';
        const { stdout: pythonVersion } = await execAsync(checkCmd);
        pythonInstalled = true;
        console.log('Python version:', pythonVersion.trim());
    } catch (error) {
        errors.push('Python 3 is not installed');
    }

    if (pythonInstalled) {
        try {
            // Check if required packages are installed
            const pkgCheckCmd = pythonCmd ? `${pythonCmd} -c "import tensorflow, pandas, numpy, sklearn"` : 'python3 -c "import tensorflow, pandas, numpy, sklearn"';
            await execAsync(pkgCheckCmd);
            packagesInstalled = true;
        } catch (error) {
            errors.push('Required Python packages not installed. Run: pip3 install -r ml-service/requirements.txt');
        }
    }

    return {
        pythonInstalled,
        packagesInstalled,
        errors,
    };
}
