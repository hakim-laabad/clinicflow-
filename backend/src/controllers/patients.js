const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/patients');

exports.list = asyncHandler(async (req, res) => {
  const { rows, meta } = await service.list(req.query);
  res.json({ success: true, data: rows, meta });
});
exports.get = asyncHandler(async (req, res) => res.json({ success: true, data: await service.get(req.params.id) }));
exports.create = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.create(req.body, req.user.id) }));
exports.update = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.update(req.params.id, req.body, req.user.id) }));
exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id, req.user.id);
  res.json({ success: true, message: 'Patient deleted' });
});
