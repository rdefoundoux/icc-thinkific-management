// controllers/registrationController.js
import User from '../models/User.js';
import asyncHandler from 'express-async-handler';
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


// @desc    Register a new user with GDPR compliance for PCNC
// @route   POST /api/v1/registrations
// @access  Public
export const validateRegistration = asyncHandler(async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        whatsappNumber,
        address,
        city,
        postalCode,
        department,
        country,
        birthDate,
        gender,
        localChurch,
        nonIccChurch,
        iccMember,
        memberSince,
        iccCampus,
        staffMember,
        convertedDate,
        baptized,
        baptismDate,
        previousCourses,
        preferredSchedule,
        comments,
        gdprConsent
    } = req.body;

    // Check required GDPR consent
    if (!gdprConsent || !gdprConsent.dataProcessing) {
        return res.status(400).json({
            success: false,
            error: 'Le consentement RGPD est requis'
        });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            error: 'Un utilisateur avec cet email existe déjà'
        });
    }

    // Create user with all PCNC fields
    const user = await User.create({
        email,
        firstName,
        lastName,
        whatsappNumber,
        address,
        city,
        postalCode,
        department,
        country,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        gender,
        localChurch,
        nonIccChurch,
        iccMember,
        memberSince: memberSince ? new Date(memberSince) : undefined,
        iccCampus,
        staffMember,
        convertedDate: convertedDate ? new Date(convertedDate) : undefined,
        baptized,
        baptismDate: baptismDate ? new Date(baptismDate) : undefined,
        previousCourses,
        preferredSchedule,
        comments,
        roles: ['student'],
        requiresPasswordReset: true,
        gdprConsent: {
            dataProcessingAccepted: gdprConsent.dataProcessing,
            acceptedAt: new Date()
        }
    });

    // Remove sensitive data from response
    const userData = user.toObject();
    delete userData.password;

    // Send confirmation email (implementation needed)

    res.status(201).json({
        success: true,
        data: userData
    });
});

