import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as db from '../db/index.js';
import { env } from '../config/env.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Username and password are required');
    }
    const user = await db.getUserByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid credentials', 401);
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name, role: user.role },
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res, next) {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
    const { password_hash, ...safe } = user;
    res.json({ success: true, data: safe });
  } catch (e) {
    next(e);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { full_name, email } = req.body;
    const user = await db.updateUserProfile(req.user.id, { full_name, email });
    if (!user) throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
    const { password_hash, ...safe } = user;
    res.json({ success: true, data: safe });
  } catch (e) {
    next(e);
  }
}
