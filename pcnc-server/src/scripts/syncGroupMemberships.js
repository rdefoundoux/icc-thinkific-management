import 'dotenv/config';

import { prisma, disconnectPrisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import ThinkificService from '../services/ThinkificService.js';

async function syncStudentsToThinkificGroups() {
    const classes = await prisma.class.findMany({
        where: { thinkificGroupId: { not: '' } },
        include: {
            students: {
                include: { user: { select: { id: true, thinkificId: true } } },
            },
        },
    });

    logger.info({ count: classes.length }, 'classes with Thinkific groups');

    for (const cls of classes) {
        logger.info(
            { classId: cls.id, groupId: cls.thinkificGroupId, name: cls.thinkificGroupName },
            'processing class',
        );

        try {
            const groupUsers = await ThinkificService.getGroupUsers(cls.thinkificGroupId);
            const groupUserIds = new Set(groupUsers.map((u) => String(u.id)));

            let addedCount = 0;
            let errorCount = 0;

            for (const cs of cls.students) {
                const student = cs.user;
                if (!student?.thinkificId) continue;

                if (!groupUserIds.has(String(student.thinkificId))) {
                    try {
                        await ThinkificService.addUserToGroup(
                            student.thinkificId,
                            cls.thinkificGroupId,
                        );
                        addedCount += 1;
                    } catch (err) {
                        logger.warn(
                            { err: err.message, studentId: student.id },
                            'add to group failed',
                        );
                        errorCount += 1;
                    }
                }
            }

            logger.info({ classId: cls.id, addedCount, errorCount }, 'class sync complete');
        } catch (err) {
            logger.error({ err: err.message, classId: cls.id }, 'class sync failed');
        }
    }
}

(async () => {
    try {
        await syncStudentsToThinkificGroups();
        logger.info('sync process completed');
        await disconnectPrisma();
        process.exit(0);
    } catch (err) {
        logger.fatal({ err }, 'sync process fatal');
        await disconnectPrisma();
        process.exit(1);
    }
})();
