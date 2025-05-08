import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Defines the schema for the User model, including Thinkific integration fields,
 * OAuth fields, and additional fields for PCNC registration.
 */
const userSchema = new mongoose.Schema(
    {
        /**
         * The Thinkific ID (for syncing with Thinkific).
         * Marked as unique, index, and sparse to allow null values.
         */
        thinkificId: {
            type: String,
            index: {
                unique: true,
                partialFilterExpression: {
                    thinkificId: {
                        $exists: true,
                        $ne: null
                    }
                }
            }
        },

        /**
         * The user's email address.
         * This field is required unless it’s an OAuth user.
         */
        email: {
            type: String,
            required: function () {
                return !this.isOAuthUser;
            },
            unique: true,
            match: [
                /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                'Invalid email format'
            ]
        },

        /**
         * The user's first name.
         */
        firstName: String,

        /**
         * The user's last name.
         */
        lastName: String,

        /**
         * The user’s password (hashed before saving).
         */
        password: {
            type: String
        },

        /**
         * Flag to indicate if the user is an OAuth user (e.g., Google, Facebook).
         */
        isOAuthUser: {
            type: Boolean,
            default: false
        },

        /**
         * The date/time the user last logged in.
         */
        lastLogin: Date,

        /**
         * Provider used for OAuth (e.g., google, facebook).
         */
        oauthProvider: String,

        /**
         * Access token returned by the OAuth provider.
         */
        accessToken: String,

        /**
         * The user’s roles. Each user may have multiple roles (e.g., student, teacher).
         */
        roles: {
            type: [String],
            enum: ['admin', 'teacher', 'rsf', 'sf', 'coordinator', 'student'],
            default: ['student']
        },

        /**
         * A phone number for contacting the user on WhatsApp.
         */
        whatsappNumber: String,

        /**
         * The user’s physical address.
         */
        address: String,

        /**
         * The city where the user resides.
         */
        city: String,

        /**
         * The user’s postal code.
         */
        postalCode: String,

        /**
         * Department (in some countries, this is an administrative division).
         */
        department: String,

        /**
         * The user’s country.
         */
        country: String,

        /**
         * The user’s birth date.
         */
        birthDate: Date,

        /**
         * The user’s gender.
         */
        gender: String,

        /**
         * The name of the local church the user attends.
         */
        localChurch: String,

        /**
         * Name of a non-ICC church if country or region differs.
         */
        nonIccChurch: String,

        /**
         * Indicates whether this user is an ICC member.
         */
        iccMember: {
            type: Boolean,
            default: false
        },

        /**
         * The date when the user became an ICC member.
         */
        memberSince: Date,

        /**
         * Details about the ICC campus the user attends.
         */
        iccCampus: String,

        /**
         * Indicates if the user is an ICC staff member.
         */
        staffMember: String,

        /**
         * Date when the user was converted (spiritually).
         */
        convertedDate: Date,

        /**
         * Indicates if the user is baptized.
         */
        baptized: String,

        /**
         * Date of the user’s baptism.
         */
        baptismDate: Date,

        /**
         * List of courses the user has previously taken.
         */
        previousCourses: [String],

        /**
         * The user’s preferred schedule for classes.
         */
        preferredSchedule: String,

        /**
         * Miscellaneous notes or comments about the user.
         */
        comments: String,

        /**
         * GDPR consent section (data processing acceptance).
         */
        gdprConsent: {
            dataProcessingAccepted: {
                type: Boolean,
                default: false
            },
            acceptedAt: Date
        },

        /**
         * Array of proxy mappings (role-proxy pairs).
         */
        proxyMappings: [
            {
                role: String,
                proxyId: mongoose.Schema.Types.ObjectId
            }
        ],

        /**
         * Thinkific enrollments, stored as an array of objects
         * tracking course ID, status, and completion date.
         */
        thinkificEnrollments: [
            {
                courseId: String,
                status: String,
                completedAt: Date
            }
        ],

        /**
         * The last time this user object was synced with Thinkific.
         */
        lastSyncAt: Date,

        /**
         * The user’s subdomain (if using multi-tenant or subdomain-based logic).
         */
        subdomain: String,

        /**
         * An optional global identifier for the user (if needed for external systems).
         */
        gid: String,

        /**
         * List of students managed by this user (SF role)
         */
        managedStudents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User' // Reference to other User documents (students)
            }
        ],

        /**
         * List of classes where this user manages students
         */
        managedClasses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Class' // Reference to Class documents
            }
        ],
        attendance: [{
            name: String,
            presentDays: Number,
            totalDays: Number
        }],
        results: {
            average: { type: Number, min: 0, max: 100 },
            tests: [{
                name: String,
                score: { type: Number, min: 0, max: 100 },
                date: { type: Date, default: Date.now }
            }]
        },
        parentalAuth: {
            signature: String,     // Base64 signature image
            signedAt: Date,        // Date of signature
            parentName: String,    // Parent's full name
            parentEmail: String,   // Parent's contact email
            parentPhone: String    // Parent's contact phone
        }
    },
    {
        timestamps: true
    }
);

/**
 * Pre-save hook to hash the user’s password if it has been modified,
 * except for OAuth users who don’t store conventional passwords.
 */
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || this.isOAuthUser) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

/**
 * Static method to generate a random password for OAuth users.
 * Generates 16 random bytes, converts them to hex string,
 * then hashes them before returning.
 */
userSchema.statics.generateOAuthPassword = async function () {
    return bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
};
userSchema.index({ 'thinkificEnrollments.courseId': 1 });

export default mongoose.model('User', userSchema);
