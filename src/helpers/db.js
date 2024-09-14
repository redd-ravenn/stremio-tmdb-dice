const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const log = require('./logger');
const path = require('path');

const dbDir = path.join(__dirname, '../../db');

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    log.debug('Database directory created');
}

const createDatabase = (dbPath, dbName) => {
    return new sqlite3.Database(dbPath, (err) => {
        if (err) {
            log.error(`Failed to connect to ${dbName}: ${err.message}`);
        } else {
            log.debug(`Connected to ${dbName}`);
        }
    });
};

const genresDb = createDatabase(path.join(dbDir, 'genres.db'), 'genres.db');
const cacheDb = createDatabase(path.join(dbDir, 'cache.db'), 'cache.db');

const createTable = (db, query, tableName) => {
    db.run(query, (err) => {
        if (err) {
            log.error(`Error creating ${tableName} table: ${err.message}`);
        } else {
            log.debug(`${tableName} table is ready`);
        }
    });
};

genresDb.serialize(() => {
    createTable(
        genresDb,
        `CREATE TABLE IF NOT EXISTS genres (
            genre_id INTEGER,
            genre_name TEXT,
            media_type TEXT,
            language TEXT,
            PRIMARY KEY (genre_id, media_type, language),
            UNIQUE (genre_id, media_type, language)
        )`,
        'genres'
    );
});

cacheDb.serialize(() => {
    createTable(
        cacheDb,
        `CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            value TEXT,
            timestamp INTEGER,
            page INTEGER,
            skip INTEGER,
            genre TEXT,
            year TEXT,
            rating TEXT,
            mediaType TEXT
        )`,
        'cache'
    );
});

module.exports = {
    genresDb,
    cacheDb
};
