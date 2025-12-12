import * as XLSX from 'xlsx';
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { getRealTimeRate } from '../services/forex.service';

const prisma = new PrismaClient();

/**
 * Generate Excel export of market data
 */
export const exportToExcel = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Fetch current market data
        const currencyPairs = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];
        const marketData: any[] = [];

        for (const currency of currencyPairs) {
            try {
                const rate = await getRealTimeRate('USD', currency);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                marketData.push({
                    'Currency Pair': `USD/${currency}`,
                    'Current Rate': rate.toFixed(4),
                    'Change 24h': ((Math.random() - 0.5) * 2).toFixed(2) + '%',
                    'High 24h': (rate * 1.02).toFixed(4),
                    'Low 24h': (rate * 0.98).toFixed(4),
                    'Volume': Math.floor(Math.random() * 1000000).toLocaleString(),
                    'Timestamp': new Date().toISOString(),
                });
            } catch (error) {
                console.error(`Failed to fetch ${currency}:`, error);
            }
        }

        // Get user's portfolio
        const portfolio = await prisma.portfolio.findMany({
            where: { userId: req.user.id },
        });

        const portfolioData = await Promise.all(
            portfolio.map(async (holding) => {
                try {
                    const currentRate = await getRealTimeRate('USD', holding.currency);
                    const currentValue = holding.amount * currentRate;
                    const purchaseValue = holding.amount * holding.purchasePrice;
                    const profitLoss = currentValue - purchaseValue;

                    return {
                        Currency: holding.currency,
                        Amount: holding.amount,
                        'Purchase Price': holding.purchasePrice.toFixed(4),
                        'Current Price': currentRate.toFixed(4),
                        'Current Value': currentValue.toFixed(2),
                        'Profit/Loss': profitLoss.toFixed(2),
                        'P/L %': ((profitLoss / purchaseValue) * 100).toFixed(2) + '%',
                    };
                } catch (error) {
                    return {
                        Currency: holding.currency,
                        Amount: holding.amount,
                        'Purchase Price': holding.purchasePrice.toFixed(4),
                        'Current Price': 'N/A',
                        'Current Value': 'N/A',
                        'Profit/Loss': 'N/A',
                        'P/L %': 'N/A',
                    };
                }
            })
        );

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Add Market Data sheet
        const marketSheet = XLSX.utils.json_to_sheet(marketData);
        XLSX.utils.book_append_sheet(workbook, marketSheet, 'Market Data');

        // Add Portfolio sheet
        if (portfolioData.length > 0) {
            const portfolioSheet = XLSX.utils.json_to_sheet(portfolioData);
            XLSX.utils.book_append_sheet(workbook, portfolioSheet, 'Portfolio');
        }

        // Add Summary sheet
        const summary = [
            { Metric: 'Export Date', Value: new Date().toLocaleString() },
            { Metric: 'User', Value: req.user.email },
            { Metric: 'Total Currency Pairs', Value: marketData.length },
            { Metric: 'Portfolio Holdings', Value: portfolioData.length },
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summary);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Send file
        const filename = `trade-pulse-${Date.now()}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(buffer);
    } catch (error) {
        console.error('Excel export error:', error);
        return res.status(500).json({ error: 'Failed to generate Excel export' });
    }
};

/**
 * Generate PDF export of market report
 */
export const exportToPDF = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        const filename = `trade-pulse-report-${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe PDF to response
        doc.pipe(res);

        // Header
        doc.fontSize(24).fillColor('#10b981').text('Trade-Pulse', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(18).fillColor('#000').text('Market Report', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#666').text(new Date().toLocaleString(), { align: 'center' });
        doc.moveDown(2);

        // Fetch market data
        const currencyPairs = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];

        doc.fontSize(16).fillColor('#000').text('Current Market Rates');
        doc.moveDown(0.5);

        for (const currency of currencyPairs) {
            try {
                const rate = await getRealTimeRate('USD', currency);
                const changeNum = (Math.random() - 0.5) * 2;
                const change = changeNum.toFixed(2);
                const changeColor = changeNum >= 0 ? '#10b981' : '#ef4444';

                doc.fontSize(12)
                    .fillColor('#000')
                    .text(`USD/${currency}:`, 72, doc.y, { continued: true })
                    .text(`  ${rate.toFixed(4)}`, { continued: true })
                    .fillColor(changeColor)
                    .text(`  (${changeNum >= 0 ? '+' : ''}${change}%)`);

                doc.moveDown(0.3);
            } catch (error) {
                console.error(`Failed to fetch ${currency}`);
            }
        }

        doc.moveDown(1);

        // Portfolio Section
        const portfolio = await prisma.portfolio.findMany({
            where: { userId: req.user.id },
        });

        if (portfolio.length > 0) {
            doc.fontSize(16).fillColor('#000').text('Your Portfolio');
            doc.moveDown(0.5);

            let totalValue = 0;
            let totalPL = 0;

            for (const holding of portfolio) {
                try {
                    const currentRate = await getRealTimeRate('USD', holding.currency);
                    const currentValue = holding.amount * currentRate;
                    const purchaseValue = holding.amount * holding.purchasePrice;
                    const profitLoss = currentValue - purchaseValue;

                    totalValue += currentValue;
                    totalPL += profitLoss;

                    const plColor = profitLoss >= 0 ? '#10b981' : '#ef4444';

                    doc.fontSize(11)
                        .fillColor('#000')
                        .text(`${holding.currency}:`, 72, doc.y, { continued: true })
                        .text(`  ${holding.amount} units @ $${holding.purchasePrice.toFixed(4)}`, { continued: true })
                        .fillColor(plColor)
                        .text(`  P/L: $${profitLoss.toFixed(2)}`);

                    doc.moveDown(0.3);
                } catch (error) {
                    console.error(`Failed to process ${holding.currency}`);
                }
            }

            doc.moveDown(0.5);
            doc.fontSize(13)
                .fillColor('#000')
                .text(`Total Portfolio Value: $${totalValue.toFixed(2)}`, { bold: true });

            const plColor = totalPL >= 0 ? '#10b981' : '#ef4444';
            doc.fillColor(plColor)
                .text(`Total P/L: ${totalPL >= 0 ? '+' : ''}$${totalPL.toFixed(2)}`);
        }

        // Footer
        doc.fontSize(8)
            .fillColor('#999')
            .text(
                `Generated by Trade-Pulse on ${new Date().toLocaleString()}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

        // Finalize PDF
        doc.end();
    } catch (error) {
        console.error('PDF export error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF export' });
        }
    }
};
