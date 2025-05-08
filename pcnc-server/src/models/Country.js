// models/Country.js
import mongoose from 'mongoose';

const CountrySchema = new mongoose.Schema({
    code: { type: String, unique: true, required: true }, // e.g., 'FR'
    names: {
        en: { type: String, required: true },
        fr: { type: String, required: true },
        es: { type: String, required: true },
        it: { type: String, required: true },
        de: { type: String, required: true },
        ln: { type: String, required: true }, // Lingala
    }
});

export default mongoose.model('Country', CountrySchema);
