// models/EgliseICC.js
import mongoose from 'mongoose';

const egliseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

export default mongoose.model('EgliseICC', egliseSchema);
