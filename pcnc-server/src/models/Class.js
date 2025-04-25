// models/Class.js
import mongoose from 'mongoose';
import  ThinkificService  from '../services/ThinkificService.js';

const classSchema = new mongoose.Schema({
    type: { type: String, enum: ['online', 'onsite'], required: true },
    region: String,
    version: String, // NEW
    className: String, // NEW
    courseCode: { type: String, required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    dayName: String, // NEW
    hour: String,    // NEW
    minutes: String, // NEW
    lang: String,    // NEW
    thinkificGroupId: {
        type: String,
        required: [true, 'Thinkific group ID is required'],
        validate: {
            validator: async function (groupId) {
                return await ThinkificService.groupExists(groupId);
            },
            message: 'Invalid Thinkific group ID',
        },
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

classSchema.index({ teacher: 1 });
classSchema.index({ thinkificGroupId: 1 });
classSchema.index({ courseCode: 1, year: 1 });

export default mongoose.model('Class', classSchema);
