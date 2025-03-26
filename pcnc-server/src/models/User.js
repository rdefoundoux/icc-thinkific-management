import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/
    },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'rsf', 'sf', 'coordinator', 'student'],
        default: 'student'
    },
    assignedClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    availability: [{
        day: String,
        hours: [String]
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    thinkificId: { type: String, unique: true },
    thinkificData: {
        avatarUrl: String,
        customFields: Map,
        enrollments: [{
            courseId: String,
            status: String,
            completedAt: Date
        }]
    },
    lastSyncedAt: Date
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


// Remove sensitive data from response
userSchema.methods.toProfile = function() {
    const user = this.toObject();
    delete user.password;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpire;
    return user;
};

export default mongoose.model('User', userSchema);



