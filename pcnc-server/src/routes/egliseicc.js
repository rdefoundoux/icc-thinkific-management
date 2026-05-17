import express from 'express';

import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/requestContext.js';

const router = express.Router();

router.get(
    '/',
    asyncHandler(async (_req, res) => {
        const eglises = await prisma.egliseICC.findMany({ orderBy: { name: 'asc' } });
        res.json(eglises);
    }),
);

export default router;
