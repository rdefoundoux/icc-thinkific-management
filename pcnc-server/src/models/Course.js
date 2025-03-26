import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        enum: ['001', '101', '201']
    },
    title: { type: String, required: true },
    thinkificId: { type: String, required: true }
});

export default mongoose.model('Course', courseSchema);
