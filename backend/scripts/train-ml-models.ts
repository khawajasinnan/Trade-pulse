#!/usr/bin/env tsx
/**
 * Script to train ML models for all currency pairs
 * Calls the Python ML service to train LSTM models
 */

import { trainAndPredict } from '../src/services/prediction.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CURRENCY_PAIRS = ['EUR-USD', 'GBP-USD', 'USD-JPY', 'AUD-USD', 'USD-CAD'];

async function trainModels() {
    console.log('🧠 Starting ML model training...\n');

    // Check if we have enough historical data
    for (const pair of CURRENCY_PAIRS) {
        const dataCount = await prisma.historicalData.count({
            where: { currencyPair: pair },
        });

        console.log(`📊 ${pair}: ${dataCount} historical records`);

        if (dataCount < 30) {
            console.log(`⚠️  ${pair}: Insufficient data (need at least 30 records)`);
            console.log(`   Run: npm run populate-data to collect more data\n`);
            continue;
        }

        try {
            console.log(`🚀 Training model for ${pair}...`);
            const result = await trainAndPredict(pair);

            // Store prediction in database
            await prisma.prediction.create({
                data: {
                    currencyPair: pair,
                    predictedValue: result.predictedValue,
                    direction: result.direction,
                    confidence: result.confidence,
                    modelVersion: '1.0',
                },
            });

            console.log(`✅ ${pair} - Prediction: ${result.predictedValue.toFixed(4)}`);
            console.log(`   Direction: ${result.direction} | Confidence: ${result.confidence}%`);
            console.log(`   Recommendation: ${result.recommendation}\n`);

        } catch (error: any) {
            console.error(`❌ Failed to train ${pair}:`, error.message);
        }
    }

    console.log('🎉 Training complete!');
}

trainModels()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
