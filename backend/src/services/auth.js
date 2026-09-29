const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const AppError = require('../utils/AppError');
const users = require('../repositories/users');

exports.login = async ({ email, password }) => {
  const user = await users.findByEmail(email);
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) throw new AppError(401, 'Invalid email or password');

  const token = jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
};
