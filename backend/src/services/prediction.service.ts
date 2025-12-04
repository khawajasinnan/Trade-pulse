import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const PYTHON_SCRIPT_PATH = path.join(process.cwd(), 'ml-service', 'ml_prediction.py');

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

        // Call Python script
        const command = `python3 ${PYTHON_SCRIPT_PATH} "${databaseUrl}" "${currencyPair}"`;

        const { stdout, stderr } = await execAsync(command, {
            timeout: 300000, // 5 minutes timeout
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });

        if (stderr && !stderr.includes('UserWarning')) {
            console.error('Python stderr:', stderr);
        }

        // Parse JSON result from stdout
        const resultMatch = stdout.match(/=== RESULT ===\n([\s\S]+)/);
        if (!resultMatch) {
            throw new Error('Failed to parse prediction result from Python script');
        }

        const result = JSON.parse(resultMatch[1]);

        console.log(`Prediction complete for ${currencyPair}`);
        console.log(`Direction: ${result.direction}, Confidence: ${result.confidence}`);

        return {
            predictedValue: result.predicted_value,
            direction: result.direction as 'UP' | 'DOWN' | 'NEUTRAL',
            confidence: result.confidence,
            recommendation: result.recommendation as 'BUY' | 'SELL' | 'HOLD',
        };
    } catch (error: any) {
        console.error('Error in trainAndPredict:', error);

        // Check if it's a timeout error
        if (error.killed) {
            throw new Error('Prediction timeout - model training took too long');
        }

        // Check if Python is not installed
        if (error.message.includes('python3')) {
            throw new Error('Python 3 is not installed or not in PATH');
        }

        throw new Error(`Prediction failed: ${error.message}`);
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

    // Check if prediction is recent (within 24 hours)
    const age = Date.now() - prediction.createdAt.getTime();
    const isRecent = age < 24 * 60 * 60 * 1000;

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
export async function checkPythonEnvironment(): Promise<{
    pythonInstalled: boolean;
    packagesInstalled: boolean;
    errors: string[];
}> {
    const errors: string[] = [];
    let pythonInstalled = false;
    let packagesInstalled = false;

    try {
        // Check Python installation
        const { stdout: pythonVersion } = await execAsync('python3 --version');
        pythonInstalled = true;
        console.log('Python version:', pythonVersion.trim());
    } catch (error) {
        errors.push('Python 3 is not installed');
    }

    if (pythonInstalled) {
        try {
            // Check if required packages are installed
            await execAsync('python3 -c "import tensorflow, pandas, numpy, sklearn"');
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
