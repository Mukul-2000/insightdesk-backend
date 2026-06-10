import express, { NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { UserDao } from '../dao/user.dao.js'; // 👈 Switch import to the DAO
import { AppError } from '../errorhandler/appError.js';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/user.model.js';
import { EmailService } from '../services/emailService.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

      if (user.passwordHash === 'OAUTH_GOOGLE_EXTERNAL_ACCOUNT') {
        throw new AppError('This email is registered via Google OAuth. Please click the "Sign in with Google" button.', 400);
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

  static async googleLogin(req: express.Request, res: express.Response, next: NextFunction) {
    try {
      const { token }: any = req.body;

      if (!token) {
        throw new AppError('Google authorization id_token payload is required.', 400);
      }

      // 1. Authenticate the token with Google's servers
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new AppError('Invalid Google credential package payload structural validation.', 401);
      }

      const { email, name } = payload;

      // 2. Query MongoDB Atlas or create the profile record if it's their first login
      let user = await UserDao.findByEmail(email);

      if (!user) {
        user = await UserDao.createUser({
          name,
          email,
          passwordHash: 'OAUTH_GOOGLE_EXTERNAL_ACCOUNT'
        });
      }

      // 3. Issue your standard internal InsightDesk session JWT token mapping
      const appToken = jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        message: 'Successfully authenticated session via Google account framework routing.',
        token: appToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isPasswordSet: user.passwordHash !== 'OAUTH_GOOGLE_EXTERNAL_ACCOUNT'
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async updatePassword(req: express.Request, res: express.Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId; // Extracted via requireAuth token gate
      const { oldPassword, newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        throw new AppError('A valid new password string (minimum 8 characters) is required.', 400);
      }

      // 1. Resolve user profile context from MongoDB Atlas
      const user = await UserDao.findById(userId);
      if (!user) {
        throw new AppError('User profile context not found.', 404);
      }

      // 2. Identify account lineage profile signatures
      const isGoogleOAuthAccount = user.passwordHash === 'OAUTH_GOOGLE_EXTERNAL_ACCOUNT';

      // 3. Condition verification gates based on account status rules
      if (!isGoogleOAuthAccount) {
        if (!oldPassword) {
          throw new AppError('Current account password is required to verify identity before modification.', 400);
        }

        // Verify matching current password hash
        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
          throw new AppError('Incorrect current password provided.', 401);
        }
      }

      // 4. Transform plaintext new password to cryptographic hash string
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // 5. Commit mutations to the document model
      await UserDao.updatePasswordHash(userId, hashedNewPassword);

      res.status(200).json({
        success: true,
        message: isGoogleOAuthAccount
          ? 'Password established successfully! Your profile has transformed to dual login architecture.'
          : 'Account security configuration credentials modified successfully.',
        isPasswordSet: true // Returns confirmation state tracking flag
      });

    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: express.Request, res: express.Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) throw new AppError('Token and new password parameters are required.', 400);

      // Hash the incoming URL token parameter to match against our stored DB hash
      const encryptedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await UserDao.findByResetToken(encryptedToken);
      if (!user) {
        throw new AppError('Password recovery token is invalid or has expired.', 400);
      }

      // Update user password and wipe out temporary token fields
      user.passwordHash = await bcrypt.hash(newPassword, 12);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Account password updated successfully. You can now log in.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: express.Request, res: express.Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new AppError('Email address is required.', 400);

      const user = await UserDao.findByEmail(email);

      // Security guard: obfuscate check loops to prevent email enumeration attacks
      if (!user) {
        res.status(200).json({ success: true, message: 'If the account exists, a reset link has been dispatched.' });
        return;
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const encryptedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

      await UserDao.setResetToken(user.email, encryptedToken, tokenExpiry);

      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;

      // ⚡ DISPATCH LIVE EMAIL INFRASTRUCTURE HERE:
      await EmailService.sendPasswordResetEmail(user.email, resetUrl, user.name);

      res.status(200).json({
        success: true,
        message: 'If the account exists, a reset link has been dispatched.'
      });
    } catch (error) {
      next(error);
    }
  }
}