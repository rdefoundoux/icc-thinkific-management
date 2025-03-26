import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        enum: ['001', '101', '201'],
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            async validator(teacherId) {
                const existing = await mongoose.model('Class').findOne({ teacher: teacherId });
                return !existing;
            },
            message: 'Professeur déjà assigné à une autre classe'
        }
    },
    schedule: {
        startDate: { type: Date, required: true },
        sessions: [{
            date: Date,
            startTime: String,
            endTime: String,
            zoomLink: String
        }]
    },
    thinkificGroupId: String,
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

export default mongoose.model('Class', classSchema);
