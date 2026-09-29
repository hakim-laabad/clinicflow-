const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/auth');

exports.login = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.login(req.body) });
});

exports.me = (req, res) => res.json({ success: true, data: req.user });
