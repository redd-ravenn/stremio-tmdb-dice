const express = require('express');
const log = require('../helpers/logger');
const { fetchData, getGenreId } = require('../api/tmdb');

const router = express.Router();

router.get("/:configParameters?/catalog/:type/:id/:extra?.json", async (req, res) => {
    const { configParameters, type, id, extra } = req.params;
    const { cacheDuration = '3d', ...query } = req.query;
    const config = configParameters ? JSON.parse(decodeURIComponent(configParameters)) : {};
    const { language, hideNoPoster, tmdbApiKey, fanartApiKey, rpdbApiKey } = config;

    log.info(`Catalog request: type=${type}, id=${id}, language=${language}`);
    log.debug(`Extra parameters: ${JSON.stringify(query)}`);

    const mediaType = type === 'series' ? 'tv' : type;
    if (!['movie', 'tv'].includes(mediaType)) {
        log.error(`Invalid catalog type: ${mediaType}`);
        return res.status(400).json({ metas: [] });
    }

    try {
        let extraParams = { ...query };

        if (extra) {
            const decodedExtra = decodeURIComponent(extra);
            extraParams = {
                ...extraParams,
                ...Object.fromEntries(
                    decodedExtra.split(/(?<!\s)&(?!\s)/).map(param => {
                        const [key, value] = param.split('=').map(decodeURIComponent);
                        return [key.trim(), value.trim()];
                    })
                )
            };
        }

        if (language) extraParams.language = language;
        if (hideNoPoster !== undefined) extraParams.hideNoPoster = String(hideNoPoster);

        if (extraParams.genre) {
            const genreId = await getGenreId(mediaType, extraParams.genre);
            if (genreId) {
                extraParams.with_genres = genreId;
            } else {
                log.warn(`Genre ${extraParams.genre} not found for ${mediaType}`);
            }
        }

        log.debug(`Extra parameters after processing: ${JSON.stringify(extraParams)}`);

        const metas = await fetchData(mediaType, id, extraParams, cacheDuration, tmdbApiKey, rpdbApiKey, fanartApiKey);

        res.json({
            metas: extraParams.hideNoPoster === 'true' ? metas.filter(meta => meta.poster) : metas
        });
    } catch (error) {
        log.error(`Error fetching catalog data: ${error.message}`);
        res.status(500).json({ metas: [] });
    }
});

module.exports = router;
