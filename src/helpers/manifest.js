const { genresDb } = require('./db');

const getCurrentYear = () => new Date().getFullYear();

const generateYearIntervals = (startYear = 1880, endYear = getCurrentYear(), interval = 4) => {
    const intervals = [];
    endYear = Math.max(endYear, startYear);

    for (let year = endYear; year >= startYear; year -= interval) {
        const nextYear = Math.max(year - interval + 1, startYear);
        intervals.push(`${nextYear}-${year}`);
    }

    const [firstStart, firstEnd] = intervals.length 
        ? intervals[intervals.length - 1].split('-').map(Number) 
        : [startYear, endYear];

    if (firstStart > startYear) {
        intervals[intervals.length - 1] = `${startYear}-${firstEnd}`;
    }

    return intervals.length ? intervals : [`${startYear}-${endYear}`];
};

const getGenres = (type, language) => 
    new Promise((resolve, reject) => {
        const query = `SELECT genre_name FROM genres WHERE media_type = ? AND language = ?`;
        genresDb.all(query, [type, language], (err, rows) => {
            if (err) return reject(err);
            resolve(rows.map(row => row.genre_name));
        });
    });

const generateManifest = async (language) => {
    try {
        const [movieGenres, seriesGenres] = await Promise.all([
            getGenres('movie', language),
            getGenres('tv', language)
        ]);

        const yearIntervals = generateYearIntervals();

        return {
            id: 'community.stremiotmdbdice',
            version: '1.0.0',
            logo: "https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg",
            name: 'Stremio TMDB Dice',
            description: 'A catalog featuring content from TMDB with filters that allow for generating random content recommendations.',
            types: ['movie', 'series'],
            idPrefixes: ['tt'],
            resources: ['catalog'],
            catalogs: [
                {
                    type: "movie",
                    id: "random_movies",
                    name: "Random Movies",
                    extra: [
                        { name: "genre", options: movieGenres.length ? movieGenres : ["No genres available"], isRequired: false },
                        { name: "rating", options: ["8-10", "6-8", "4-6", "2-4", "0-2"], isRequired: false },
                        { name: "year", options: yearIntervals, isRequired: false },
                        { name: 'skip', isRequired: false },
                    ]
                },
                {
                    type: "series",
                    id: "random_series",
                    name: "Random Series",
                    extra: [
                        { name: "genre", options: seriesGenres.length ? seriesGenres : ["No genres available"], isRequired: false },
                        { name: "rating", options: ["8-10", "6-8", "4-6", "2-4", "0-2"], isRequired: false },
                        { name: "year", options: yearIntervals, isRequired: false },
                        { name: 'skip', isRequired: false },
                    ]
                }
            ],
            behaviorHints: {
                configurable: true,
                configurationRequired: false,
            }
        };
    } catch (error) {
        console.error('Error generating manifest:', error);
    }
};

module.exports = generateManifest;
