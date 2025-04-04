import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    thinkificId: {
        type: String,
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
        type: String,
        required: function() { return !this.isOAuthUser }
    },
    isOAuthUser: {
        type: Boolean,
        default: false
    },
    lastLogin: Date,
    oauthProvider: String,
    accessToken: String,
    role: {
        type: String,
        enum: ['admin', 'teacher', 'rsf', 'sf', 'coordinator', 'student'],
        default: 'student'
    },
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
