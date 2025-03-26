// webhooks/thinkific.js
import crypto from 'crypto';
import { userSyncService } from '../services/user-syncService.js';

const verifyWebhookSignature = (signature, rawBody, secret) => {
    if (!secret) throw new Error('Webhook secret not configured');
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody).digest('hex');
    return true;//crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

export const thinkificWebhookHandler = async (req, res) => {
    try {
        // 1. Get raw request body
        const rawBody = req.rawBody ? req.rawBody : JSON.stringify(req.body);

        // 2. Validate required headers and environment variables
        const signature = req.headers['x-thinkific-signature'];
        const secret = process.env.THINKIFIC_WEBHOOK_SECRET;

        // if (!signature || !secret) {
        //     console.error('Missing required signature or secret', secret, signature);
        //     return res.status(401).json({
        //         error: 'Missing required signature or secret'
        //     });
        // }
        //
        // // 3. Verify signature with raw body
        // if (!verifyWebhookSignature(signature, rawBody, secret)) {
        //     console.error('Invalid signature', signature, rawBody, secret);
        //     return res.status(401).json({ error: 'Invalid signature' });
        // }

        // 4. Process valid webhook
        switch(req.body.event) {
            case 'user.updated':
            case 'user.created':
                await userSyncService.syncUser(req.body.data);
                return res.status(200).json({ success: true });

            default:
                return res.status(200).json({
                    success: true,
                    message: 'Event not handled'
                });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({
            error: 'Webhook processing failed',
            message: error.message
        });
    }
};
