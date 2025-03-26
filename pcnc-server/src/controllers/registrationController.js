import User from '../models/User.js';
import Class from '../models/Class.js';
import thinkificService from '../services/thinkificService.js';

const checkEligibility = async (studentData) => {
    // Implémentez votre logique de validation ici
    return true;
};

const createThinkificUser = async (studentData) => {
    // Implémentez la création d'utilisateur Thinkific
    return { id: 'thinkific_user_id' };
};

// Ajoutez la fonction manquante
export const assignTeacher = async (req, res) => {
    try {
        const { teacherId, classId } = req.body;

        // Logique d'assignation
        await Class.findByIdAndUpdate(classId, { teacher: teacherId });
        await thinkificService.assignTeacherToGroup(teacherId, classId);

        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const validateRegistration = async (req, res) => {
    try {
        const { studentData } = req.body;

        if (!(await checkEligibility(studentData))) {
            return res.status(400).json({ error: 'Critères non remplis' });
        }

        const availableClass = await Class.findOne({
            courseCode: studentData.course,
            'schedule.startDate': { $gt: new Date() },
            seatsAvailable: { $gt: 0 }
        }).sort('schedule.startDate');

        if (!availableClass) {
            return res.status(400).json({ error: 'Aucune classe disponible' });
        }

        const thinkificUser = await createThinkificUser(studentData);

        const newStudent = await User.create({
            ...studentData,
            thinkificId: thinkificUser.id,
            assignedClass: availableClass._id
        });

        await Class.findByIdAndUpdate(availableClass._id, {
            $inc: { seatsAvailable: -1 },
            $push: { students: newStudent._id }
        });

        res.status(201).json(newStudent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const createClass = async (req, res) => {
    try {
        const { courseCode, teacherId, schedule } = req.body;

        // Vérifier la disponibilité du professeur
        const existingClass = await Class.findOne({ teacher: teacherId });
        if (existingClass) {
            return res.status(400).json({
                error: 'Ce professeur est déjà assigné à une autre classe'
            });
        }

        // Créer la classe dans la base de données
        const newClass = new Class({
            courseCode,
            teacher: teacherId,
            schedule
        });

        // Intégration Thinkific
        const thinkificGroup = await thinkificService.createClassGroup(
            `${courseCode}-${Date.now()}`,
            courseCode
        );

        newClass.thinkificGroupId = thinkificGroup.id;
        await newClass.save();

        // Assigner le professeur dans Thinkific
        await thinkificService.assignTeacherToGroup(teacherId, thinkificGroup.id);

        // Mettre à jour l'utilisateur
        await User.findByIdAndUpdate(teacherId, {
            $addToSet: { assignedClasses: newClass._id }
        });

        res.status(201).json({
            success: true,
            data: newClass
        });

    } catch (error) {
        console.error('Erreur création classe:', error);
        res.status(500).json({
            success: false,
            error: 'Échec de la création de la classe',
            details: error.message
        });
    }
};
