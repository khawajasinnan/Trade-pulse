import { PrismaClient, AlertCondition } from '@prisma/client';
import { getRealTimeRate } from './forex.service';
import { sendMail } from './mail.service';
import { isDbBlocked } from '../utils/db-utils';

const prisma = new PrismaClient();

export const scheduleAlertChecks = (intervalMs: number = 60 * 1000) => {
    setInterval(async () => {
        try {
            if (isDbBlocked()) {
                console.warn('Skipping alert checks because DB writes blocked');
                return;
            }

            // Find active, untriggered alerts
            const alerts = await prisma.alert.findMany({ where: { triggered: false } });

            for (const alert of alerts) {
                try {
                    // parse currency pair into base & target
                    const [base, target] = alert.currencyPair.includes('/') ? alert.currencyPair.split('/') : alert.currencyPair.split('-');
                    const rate = await getRealTimeRate(base, target);
                    let triggered: boolean = false;
                    switch (alert.conditionType) {
                        case 'GREATER_THAN':
                            triggered = rate > alert.targetValue;
                            break;
                        case 'LESS_THAN':
                            triggered = rate < alert.targetValue;
                            break;
                        case 'GREATER_EQUAL':
                            triggered = rate >= alert.targetValue;
                            break;
                        case 'LESS_EQUAL':
                            triggered = rate <= alert.targetValue;
                            break;
                        default:
                            triggered = false;
                    }

                    if (triggered) {
                        // Mark as triggered
                        await prisma.alert.update({ where: { id: alert.id }, data: { triggered: true, triggeredAt: new Date() } });

                        // Send email to user
                        const user = await prisma.user.findUnique({ where: { id: alert.userId } });
                        if (user && user.email) {
                            const subject = `Price Alert triggered for ${alert.currencyPair}`;
                            const html = `<p>Your alert for ${alert.currencyPair} has been triggered.</p><p>Condition: ${alert.conditionType} ${alert.targetValue}</p><p>Current rate: ${rate}</p>`;
                            try {
                                await sendMail(user.email, subject, html);
                            } catch (err) {
                                console.error('Failed to send alert email:', err);
                            }
                        }
                    }
                } catch (err) {
                    console.warn('Failed to process alert', alert.id, err);
                }
            }
        } catch (err) {
            console.error('Scheduled alert check error:', err);
        }
    }, intervalMs);
};

export default { scheduleAlertChecks };
