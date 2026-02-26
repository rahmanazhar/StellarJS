import { Request, Response } from 'express';
import { UserModel } from '../auth/UserModel';

export class UserService {
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query = search
        ? {
            $or: [
              { name: new RegExp(String(search), 'i') },
              { email: new RegExp(String(search), 'i') },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        UserModel.find(query).skip(skip).limit(Number(limit)),
        UserModel.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: users,
        pagination: { page: Number(page), limit: Number(limit), total },
      });
    } catch (error) {
      res.status(500).json({ error: { message: 'Failed to fetch users' } });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) {
        res.status(404).json({ error: { message: 'User not found' } });
        return;
      }
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ error: { message: 'Failed to fetch user' } });
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, roles } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: { message: 'Email and password are required' } });
        return;
      }

      const existing = await UserModel.findOne({ email: email.toLowerCase() });
      if (existing) {
        res.status(409).json({ error: { message: 'Email already registered' } });
        return;
      }

      const user = await UserModel.create({
        email: email.toLowerCase(),
        password,
        name,
        roles,
      });

      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ error: { message: 'Failed to create user' } });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const updates = { ...req.body };
      // Prevent changing password or email through this endpoint
      delete updates.password;
      delete updates.email;

      const user = await UserModel.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        res.status(404).json({ error: { message: 'User not found' } });
        return;
      }

      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ error: { message: 'Failed to update user' } });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await UserModel.findByIdAndDelete(req.params.id);
      if (!user) {
        res.status(404).json({ error: { message: 'User not found' } });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: { message: 'Failed to delete user' } });
    }
  }
}

export const createUserService = (): UserService => {
  return new UserService();
};
