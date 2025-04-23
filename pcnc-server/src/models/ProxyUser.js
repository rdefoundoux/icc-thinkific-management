// models/ProxyUser.js
import mongoose from 'mongoose';

const ProxyUserSchema = new mongoose.Schema({
    thinkificId: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    apiToken: { type: String, required: true },
    role: {
        type: String,
        enum: ['site_admin', 'course_admin', 'group_analyst'],
        required: true
    },
    usageCount: { type: Number, default: 0 },
    lastUsed: Date,
    isActive: { type: Boolean, default: true }
});

export default mongoose.model('ProxyUser', ProxyUserSchema);
