import mongoose from 'mongoose';
import ThinkificService from '../services/ThinkificService.js';

const courseSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        enum: ['001', '101', '201']
    },
    title: { type: String, required: true },
    thinkificId: {
        type: String,
        required: true,
        validate: {
            validator: async function(id) {
                try {
                    await ThinkificService.getCourse(id);
                    return true;
                } catch (error) {
                    return false;
                }
            },
            message: 'Invalid Thinkific course ID'
        }
    },
    language: {
        type: String,
        required: true,
        enum: ['english', 'french', 'german'],
        default: 'english'
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    }
});
courseSchema.index({ code: 1, language: 1 }, { unique: true });
export default mongoose.model('Course', courseSchema);
