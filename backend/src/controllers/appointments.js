const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/appointments');

exports.list = asyncHandler(async (req, res) => res.json({ success: true, data: await service.list(req.query) }));
exports.create = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await service.create(req.body, req.user.id) }));
exports.updateStatus = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.updateStatus(req.params.id, req.body.status, req.user.id) }));
