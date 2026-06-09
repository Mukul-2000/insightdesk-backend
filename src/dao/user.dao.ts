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
}