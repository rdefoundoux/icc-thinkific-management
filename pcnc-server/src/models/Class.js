// models/Class.js
import mongoose from 'mongoose';
import  ThinkificService  from '../services/ThinkificService.js';

const classSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['online', 'onsite'],
        required: true
    },
    region: String,
    courseCode: {
        type: String,
        required: true
    },
    month: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    thinkificGroupId: {
        type: String,
        required: [true, 'Thinkific group ID is required'],
        validate: {
            validator: async function(groupId) {
                return await ThinkificService.groupExists(groupId);
            },
            message: 'Invalid Thinkific group ID'
        }
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    traineeTeachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    staff: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    coordinator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    staffManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

classSchema.pre('save', function(next) {
    if (this.isModified('teacher')) {
        this.constructor.findOne({ teacher: this.teacher })
            .then(existingClass => {
                if (existingClass) throw new Error('Teacher already assigned to another class');
                next();
            })
            .catch(next);
    } else {
        next();
    }
});

export default mongoose.model('Class', classSchema);
