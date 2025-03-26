import Class from '../models/Class.js'; // Ajouter l'import manquant

// Remplacer exports par export const
export const validateClassCreation = async (req, res, next) => {
    const { courseCode, teacherId } = req.body;

    // Validation du code cours
    if (!['001', '101', '201'].includes(courseCode)) {
        return res.status(400).json({
            error: 'Code de cours invalide'
        });
    }

    // Vérification disponibilité professeur
    try {
        const existingAssignment = await Class.findOne({ teacher: teacherId });
        if (existingAssignment) {
            return res.status(400).json({
                error: 'Professeur déjà assigné à une classe'
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};


