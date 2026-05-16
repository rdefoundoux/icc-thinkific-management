import nodemailer from 'nodemailer';

import config from '../config/env.js';
import { logger } from '../lib/logger.js';

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    if (!config.SMTP?.HOST) {
        logger.warn('SMTP not configured; emails will be skipped');
        return null;
    }
    transporter = nodemailer.createTransport({
        host: config.SMTP.HOST,
        port: config.SMTP.PORT || 587,
        secure: (config.SMTP.PORT || 587) === 465,
        auth: config.SMTP.USER
            ? { user: config.SMTP.USER, pass: config.SMTP.PASSWORD }
            : undefined,
    });
    return transporter;
}

/**
 * Send an email via SMTP. Silently no-ops when SMTP is not configured.
 */
export async function sendEmail({ to, subject, text, html }) {
    const tx = getTransporter();
    if (!tx) return null;

    const info = await tx.sendMail({
        from: config.SMTP.FROM || 'no-reply@example.com',
        to,
        subject,
        text,
        html,
    });
    logger.info({ messageId: info.messageId, to }, 'email sent');
    return info;
}
