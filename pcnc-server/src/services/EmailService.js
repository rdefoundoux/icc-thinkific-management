// EmailService.js
import nodemailer from 'nodemailer';

// Configure the transporter using SMTP environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send an email.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body (optional if html provided)
 * @param {string} [options.html] - HTML body (optional if text provided)
 */
export async function sendEmail({ to, subject, text, html }) {
    const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to,
        subject,
        text,
        html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
