import mongoose from 'mongoose';
const AttendanceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    present: { type: Boolean, required: true }
});
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });
export default mongoose.model('Attendance', AttendanceSchema);
