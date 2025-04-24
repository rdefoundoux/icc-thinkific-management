// models/User.js - Extended with new fields
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    // Existing fields
    thinkificId: {
        type: String,
        index: true,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        required: function() { return !this.isOAuthUser },
        unique: true,
        match: [
            /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
            'Invalid email format'
        ]
    },
    firstName: String,
    lastName: String,
    password: {
        type: String
    },
    isOAuthUser: {
        type: Boolean,
        default: false
    },
    lastLogin: Date,
    oauthProvider: String,
    accessToken: String,
    roles: {
        type: [String],
        enum: ['admin', 'teacher', 'rsf', 'sf', 'coordinator', 'student'],
        default: ['student']
    },

    // New fields for PCNC registration
    whatsappNumber: String,
    address: String,
    city: String,
    postalCode: String,
    department: String,
    country: String,
    birthDate: Date,
    gender: String,

    // Church information
    localChurch: String,
    nonIccChurch: String,
    iccMember: {
        type: Boolean,
        default: false
    },
    memberSince: Date,
    iccCampus: String,
    staffMember: String,

    // Spiritual information
    convertedDate: Date,
    baptized: String,
    baptismDate: Date,
    previousCourses: [String],

    // Course preferences
    preferredSchedule: String,
    comments: String,

    // GDPR consent
    gdprConsent: {
        dataProcessingAccepted: {
            type: Boolean,
            default: false
        },
        acceptedAt: Date
    },

    // Existing fields continued
    proxyMappings: [{
        role: String,
        proxyId: mongoose.Schema.Types.ObjectId
    }],
    thinkificEnrollments: [{
        courseId: String,
        status: String,
        completedAt: Date
    }],
    lastSyncAt: Date,
    subdomain: String,
    gid: String
}, { timestamps: true });

// Password hashing remains the same
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || this.isOAuthUser) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// OAuth password generation remains the same
userSchema.statics.generateOAuthPassword = async function() {
    return bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
};

export default mongoose.model('User', userSchema);
