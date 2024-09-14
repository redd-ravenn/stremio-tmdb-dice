const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { cacheDb } = require('./db');
const log = require('./logger');
const baseUrl = process.env.BASE_URL || 'http://localhost:7000';

const DEFAULT_CATALOG_CACHE_DURATION = process.env.CATALOG_CONTENT_CACHE_DURATION || '3d';
const DEFAULT_RPDB_POSTER_CACHE_DURATION = process.env.RPDB_POSTER_CACHE_DURATION || '3d';

const posterDirectory = path.join(__dirname, '../../db/rpdbPosters');

if (!fs.existsSync(posterDirectory)) {
    fs.mkdirSync(posterDirectory, { recursive: true });
}

const formatFileName = (posterId) => {
    return posterId.replace(/[^a-zA-Z0-9-_]/g, '_');
};

const cacheDurationToSeconds = (duration) => {
    const match = duration.match(/^(\d+)([dh])$/);
    if (!match) throw new Error('Invalid cache duration format');

    const [ , value, unit ] = match;
    const number = parseInt(value, 10);

    switch (unit) {
        case 'd': return number * 86400;
        case 'h': return number * 3600;
        default: throw new Error('Invalid cache duration unit');
    }
};

const setCatalogCache = (key, value, duration = DEFAULT_CATALOG_CACHE_DURATION, page = 1, skip = 0, genre = null, year = null, rating = null, mediaType = null) => {
    try {
        genre = genre === null ? "undefined" : genre;
        year = year === null ? "undefined" : year;
        rating = rating === null ? "undefined" : rating;

        const durationInSeconds = cacheDurationToSeconds(duration);
        const expireTime = Math.floor(Date.now() / 1000) + durationInSeconds;

        const query = `INSERT OR REPLACE INTO cache (key, value, timestamp, page, skip, genre, year, rating, mediaType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        cacheDb.run(query, [key, JSON.stringify(value), expireTime, page, skip, genre, year, rating, mediaType], (err) => {
            if (err) {
                log.error(`Failed to set cache for key ${key}: ${err.message}`);
            } else {
                log.debug(`Cache set for key ${key} with duration ${duration}`);
            }
        });
    } catch (error) {
        log.error(`Error in setting cache: ${error.message}`);
    }
};

const getCatalogCache = (key, cacheDuration = DEFAULT_CATALOG_CACHE_DURATION) => {
    const cacheDurationInSeconds = cacheDurationToSeconds(cacheDuration);

    return new Promise((resolve, reject) => {
        cacheDb.get(
            `SELECT value, timestamp, page, skip, genre, year, rating, mediaType FROM cache WHERE key = ?`,
            [key],
            (err, row) => {
                if (err) {
                    log.error(`Error retrieving cache for key ${key}: ${err.message}`);
                    return reject(err);
                }
                if (!row) {
                    log.debug(`Cache miss for key ${key}`);
                    return resolve(null);
                }

                const isCacheValid = (Date.now() / 1000 - row.timestamp) < cacheDurationInSeconds;
                if (isCacheValid) {
                    log.debug(`Cache hit for key ${key}`);
                    resolve({
                        value: JSON.parse(row.value),
                        page: row.page,
                        skip: row.skip,
                        genre: row.genre,
                        year: row.year,
                        rating: row.rating,
                        mediaType: row.mediaType
                    });
                } else {
                    log.debug(`Cache expired for key ${key}`);
                    resolve(null);
                }
            }
        );
    });
};

const getCachedPoster = async (posterId) => {
    const formattedPosterId = formatFileName(posterId);
    const filePath = path.join(posterDirectory, `${formattedPosterId}.jpg`);
    const cacheDurationInSeconds = cacheDurationToSeconds(DEFAULT_RPDB_POSTER_CACHE_DURATION);

    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileAgeInSeconds = (Date.now() - stats.mtimeMs) / 1000;

        if (fileAgeInSeconds < cacheDurationInSeconds) {
            const posterUrl = `${baseUrl}/poster/${formattedPosterId}.jpg`;
            log.debug(`Cache hit for poster id ${posterId}, serving from ${posterUrl}`);
            return { poster_url: posterUrl };
        } else {
            log.debug(`Cache expired for poster id ${posterId}`);
            fs.unlinkSync(filePath); // Supprimer le fichier expiré
        }
    } else {
        log.debug(`Cache miss for poster id ${posterId}`);
    }

    return null;
};

const setCachedPoster = async (posterId, posterUrl) => {
    const formattedPosterId = formatFileName(posterId);
    const filePath = path.join(posterDirectory, `${formattedPosterId}.jpg`);

    try {
        const response = await axios.get(posterUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(filePath, response.data);
        log.debug(`Poster id ${posterId} cached at ${filePath}`);
    } catch (error) {
        log.error(`Error caching poster id ${posterId} from URL ${posterUrl}: ${error.message}`);
        throw error;
    }
};

module.exports = {
    setCatalogCache,
    getCatalogCache,
    setCachedPoster,
    getCachedPoster
};
