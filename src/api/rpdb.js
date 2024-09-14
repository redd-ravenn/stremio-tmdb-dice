const axios = require('axios');
const log = require('../helpers/logger');
const { setCachedPoster, getCachedPoster } = require('../helpers/cache');

const getRpdbPoster = (type, id, language, rpdbkey) => {
    const tier = rpdbkey.split("-")[0];
    const lang = language.split("-")[0];
    const baseUrl = `https://api.ratingposterdb.com/${rpdbkey}/tmdb/poster-default/${type}-${id}.jpg`;

    return (tier === "t0" || tier === "t1")
        ? baseUrl
        : `${baseUrl}&lang=${lang}`;
};

const posterCacheQueue = new Set();
const cachedPosters = new Set();

const getPosterUrl = async (content, rpdbApiKey) => {
    const posterId = `poster:${content.id}`;
    
    if (rpdbApiKey) {
        const cachedPoster = await getCachedPoster(posterId);
        if (cachedPoster) {
            log.debug(`Using cached poster URL for id ${posterId}`);
            return cachedPoster.poster_url;
        }
    }

    let posterUrl;
    
    if (rpdbApiKey) {
        const rpdbImage = getRpdbPoster('movie', content.id, 'fr', rpdbApiKey);
        log.debug(`Fetching RPDB poster from URL: ${rpdbImage}`);
        
        try {
            const response = await axios.head(rpdbImage);
            if (response.status === 200) {
                log.debug(`RPDB poster found for id ${posterId}`);
                posterUrl = rpdbImage;

                if (!cachedPosters.has(posterId)) {
                    posterCacheQueue.add({ id: posterId, url: posterUrl });
                    cachedPosters.add(posterId);
                }
            } else {
                throw new Error('Not found');
            }
        } catch (error) {
            log.warn(`Error fetching RPDB poster: ${error.message}. Falling back to TMDB poster.`);
            posterUrl = `https://image.tmdb.org/t/p/w500${content.poster_path}`;
        }
    } else {
        posterUrl = `https://image.tmdb.org/t/p/w500${content.poster_path}`;
    }
    
    return posterUrl;
};


const cachePosters = async () => {
    for (const { id, url } of posterCacheQueue) {
        try {
            await setCachedPoster(id, url);
        } catch (error) {
            log.error(`Failed to cache poster id ${id}: ${error.message}`);
        }
    }
    posterCacheQueue.clear();
    cachedPosters.clear();
};

module.exports = {
    getRpdbPoster,
    getPosterUrl,
    cachePosters
};
