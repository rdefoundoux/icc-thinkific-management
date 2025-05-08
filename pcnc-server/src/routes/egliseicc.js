// routes/egliseicc.js
import express from 'express';
import  EgliseICC from '../models/EgliseICC.js';

const router = express.Router();

// GET /api/v1/egliseicc
router.get('/', async (req, res) => {
    try {
        const eglises = await EgliseICC.find().sort({ name: 1 }); // Sort alphabetically
        res.json(eglises);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des églises.' });
    }
});

export default router;
