const { Pool, types } = require('pg');
const { databaseUrl } = require('./env');

// TIMESTAMP (no tz) values are stored as UTC: parse them as UTC. DATE stays a plain string.
types.setTypeParser(1114, (s) => new Date(`${s.replace(' ', 'T')}Z`));
types.setTypeParser(1082, (s) => s);

const pool = new Pool({ connectionString: databaseUrl, options: '-c timezone=UTC' });

module.exports = { pool, query: (text, params) => pool.query(text, params) };
