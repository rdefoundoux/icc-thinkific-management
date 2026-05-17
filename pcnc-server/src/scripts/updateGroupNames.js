import 'dotenv/config';

import { prisma, disconnectPrisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import ThinkificService from '../services/ThinkificService.js';

(async () => {
    try {
        const classes = await prisma.class.findMany();

        for (const cls of classes) {
            if (!cls.thinkificGroupId) continue;

            try {
                const thinkificGroup = await ThinkificService.getGroup(cls.thinkificGroupId);
                const groupName = thinkificGroup?.group?.name || thinkificGroup?.name || 'N/A';

                await prisma.class.update({
                    where: { id: cls.id },
                    data: { thinkificGroupName: groupName },
                });
                logger.info({ classId: cls.id, groupName }, 'updated class group name');
            } catch (err) {
                logger.warn({ err: err.message, classId: cls.id }, 'failed to update class');
            }
        }

        logger.info('done updating group names');
        await disconnectPrisma();
        process.exit(0);
    } catch (err) {
        logger.fatal({ err }, 'script error');
        await disconnectPrisma();
        process.exit(1);
    }
})();
