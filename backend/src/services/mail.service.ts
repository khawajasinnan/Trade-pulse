import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@tradepulse.example';

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
} else {
    console.warn('SMTP config incomplete. Emails will not be sent (SMTP_HOST/USER/PASS missing).');
}

export async function sendMail(
    to: string,
    subject: string,
    html: string,
    text?: string
) {
    if (!transporter) {
        console.warn('sendMail skipped because transporter is not configured.');
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: EMAIL_FROM,
            to,
            subject,
            text: text || html.replace(/<[^>]*>?/gm, ''),
            html,
        });
        console.log('Email sent:', info.messageId);
    } catch (err) {
        console.error('Failed to send email:', err);
        throw err;
    }
}

export default { sendMail };
