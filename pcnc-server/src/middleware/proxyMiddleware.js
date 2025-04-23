import { ProxyService } from '../services/ProxyService.js';
import RealUser from '../models/RealUser.js';

export const withProxy = (role) => async (req, res, next) => {
    try {
        const user = await RealUser.findById(req.user.id);
        const proxyService = new ProxyService();

        // Find existing mapping or assign new proxy
        const mapping = user.proxyMappings.find(m => m.role === role);
        const proxy = mapping
            ? await ProxyUser.findById(mapping.proxyId)
            : await proxyService.assignProxy(user.id, role);

        req.thinkificHeaders = {
            'X-Auth-Subdomain': process.env.THINKIFIC_SUBDOMAIN,
            'Authorization': `Bearer ${proxy.apiToken}`
        };

        next();
    } catch (error) {
        res.status(403).json({ error: 'Proxy assignment failed' });
    }
};
