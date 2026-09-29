const repo = require('../repositories/dashboard');

exports.stats = (tz) => repo.stats(tz);
