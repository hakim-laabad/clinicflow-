const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/dashboard');

exports.stats = asyncHandler(async (req, res) => res.json({ success: true, data: await service.stats(req.query.tz) }));
