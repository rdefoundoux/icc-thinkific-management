import crypto from 'crypto';

import { userSyncService } from '../services/user-syncService.js';
import { logger } from '../lib/logger.js';

function verifyWebhookSignature(signature, rawBody, secret) {
    if (!secret || !signature) return false;
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch {
        return false;
    }
}

export const thinkificWebhookHandler = async (req, res) => {
    try {
        const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
        const payload = typeof req.body === 'object' && !(req.body instanceof Buffer)
            ? req.body
            : JSON.parse(rawBody);

        const signature = req.headers['x-thinkific-signature'];
        const secret = process.env.THINKIFIC_WEBHOOK_SECRET;

        if (secret && signature && !verifyWebhookSignature(signature, rawBody, secret)) {
            logger.warn('thinkific webhook signature mismatch');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        switch (payload.event) {
            case 'user.updated':
            case 'user.created':
                await userSyncService.syncUser(payload.data);
                return res.status(200).json({ success: true });
            default:
                return res.status(200).json({
                    success: true,
                    message: 'Event not handled',
                });
        }
    } catch (err) {
        logger.error({ err }, 'webhook error');
        return res.status(500).json({
            error: 'Webhook processing failed',
            message: err.message,
        });
    }
};
