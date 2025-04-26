import mongoose from 'mongoose';
import ThinkificService from '../services/ThinkificService.js';

const classSchema = new mongoose.Schema({
    type: { type: String, enum: ['online', 'onsite'], required: true },
    region: String,
    version: String,
    className: String,
    courseCode: { type: String, required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    dayName: String,
    hour: String,
    minutes: String,
    lang: String,
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
    courses: [{
        thinkificCourseId: String,
        name: String,
        assignedAt: { type: Date, default: Date.now }
    }],
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rsf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Add indexes
classSchema.index({ teacher: 1 });
classSchema.index({ thinkificGroupId: 1 });
classSchema.index({ courseCode: 1, year: 1 });

export default mongoose.model('Class', classSchema);
