import mongoose from 'mongoose';

const RealUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    roles: [{
        type: String,
        enum: ['admin', 'coordinator', 'rsf', 'sf', 'teacher']
    }],
    proxyMappings: [{
        role: String,
        proxyId: mongoose.Schema.Types.ObjectId
    }]
}, { timestamps: true });

export default mongoose.model('RealUser', RealUserSchema);
