import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errorhandler/appError.js';

interface DecodedToken extends jwt.JwtPayload {
  userId: string;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = '';

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please provide a valid Bearer token.', 401);
    }

    // Verify the validity of the web token signatures
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;

    // Attach the verified user token details directly to the request envelope
    req.user = {
      userId: decoded.userId
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid session token. Access denied.', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Your login session has expired. Please log in again.', 401));
    }
    next(error);
  }
};