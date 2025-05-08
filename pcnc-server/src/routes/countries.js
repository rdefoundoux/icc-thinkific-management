// routes/countries.js
import express from 'express';
import countries from 'i18n-iso-countries';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Load locales properly
const en = require('i18n-iso-countries/langs/en.json');
const fr = require('i18n-iso-countries/langs/fr.json');
const es = require('i18n-iso-countries/langs/es.json');
const it = require('i18n-iso-countries/langs/it.json');
const de = require('i18n-iso-countries/langs/de.json');

// Register locales with correct structure
countries.registerLocale({
    locale: 'en',
    countries: en.countries
});
countries.registerLocale({
    locale: 'fr',
    countries: fr.countries
});
countries.registerLocale({
    locale: 'es',
    countries: es.countries
});
countries.registerLocale({
    locale: 'it',
    countries: it.countries
});
countries.registerLocale({
    locale: 'de',
    countries: de.countries
});

// Add Lingala support
countries.registerLocale({
    locale: 'ln',
    countries: {
        CA: 'Kanada',
        FR: 'Falansia',
        // ... add all other country translations
    }
});

const router = express.Router();

router.get('/', (req, res) => {
    const lang = req.query.lang || 'en';
    console.log('lang',req.query.lang);
    const countryList = countries.getNames(lang);

    res.json(
        Object.entries(countryList).map(([code, label]) => ({
            value: code,
            label
        }))
    );
});

export default router;
