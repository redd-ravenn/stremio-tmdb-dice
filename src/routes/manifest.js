const express = require('express');
const log = require('../helpers/logger');
const { checkGenresExistForLanguage, fetchAndStoreGenres } = require('../api/tmdb');
const generateManifest = require('../helpers/manifest');

const router = express.Router();

router.get("/:configParameters?/manifest.json", async (req, res) => {
    const { configParameters } = req.params;
    const config = configParameters ? JSON.parse(decodeURIComponent(configParameters)) : {};
    const { language, tmdbApiKey } = config;

    log.debug(`Manifest request for language: ${language}`);

    try {
        if (language && !(await checkGenresExistForLanguage(language))) {
            log.debug(`Fetching genres for language: ${language}`);
            await fetchAndStoreGenres(language, tmdbApiKey);
        }

        const manifest = await generateManifest(language);
        res.json(manifest);
    } catch (error) {
        log.error(`Error generating manifest: ${error.message}`);
        res.status(500).json({ error: 'Error generating manifest' });
    }
});

module.exports = router;
