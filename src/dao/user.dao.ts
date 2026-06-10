import { User, IUser } from '../models/user.model.js';

export class UserDao {
  /**
   * Find a user record by their unique email address
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  static async findById(userId: string): Promise<IUser | null> {
    return await User.findOne({ _id: userId });
  }

  /**
   * Create and commit a new user record to the cluster
   */
  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    return await User.create(userData);
  }

  static async updatePasswordHash(id: string, hashedNew: string): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      id,
      { passwordHash: hashedNew },
      { new: true }
    );
  }

  static async setResetToken(email: string, token: string, expiry: Date) {
    return await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { resetPasswordToken: token, resetPasswordExpires: expiry },
      { new: true }
    );
  }

  /**
   * FIND A VALID USER BY UNEXPIRED RESET TOKEN
   */
  static async findByResetToken(token: string) {
    return await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() } // Verifies token hasn't expired yet
    });
  }
}