import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserDao } from '../dao/user.dao.js'; // 👈 Switch import to the DAO
import { AppError } from '../errorhandler/appError.js';

export class AuthController {
  /**
   * Register a brand new user account
   */
  static async register(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required fields.', 400);
      }

      // 🚨 Refactored to use UserDao
      const userExists = await UserDao.findByEmail(email);
      if (userExists) {
        throw new AppError('An account with this email address already exists.', 400);
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 🚨 Refactored to use UserDao
      const newUser = await UserDao.createUser({
        name,
        email,
        passwordHash
      });

      const token = jwt.sign(
        { userId: newUser._id }, 
        process.env.JWT_SECRET as string, 
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify credentials and return an access session token
   */
  static async login(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Please provide both email and password.', 400);
      }

      // 🚨 Refactored to use UserDao
      const user = await UserDao.findByEmail(email);
      if (!user) {
        throw new AppError('Invalid email or password credentials.', 401);
      }

      const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordMatch) {
        throw new AppError('Invalid email or password credentials.', 401);
      }

      const token = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET as string, 
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
      );

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      next(error);
    }
  }
}