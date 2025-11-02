import { Request, Response } from 'express';

/**
 * Example User Service
 * This demonstrates how to create a service in StellarJS
 */
export class UserService {
  private users: Map<string, any>;

  constructor() {
    this.users = new Map();
    // Add some sample users
    this.users.set('1', { id: '1', name: 'John Doe', email: 'john@example.com' });
    this.users.set('2', { id: '2', name: 'Jane Smith', email: 'jane@example.com' });
  }

  /**
   * Get all users
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = Array.from(this.users.values());
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({
        error: { message: 'Failed to fetch users' },
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = this.users.get(id);

      if (!user) {
        res.status(404).json({
          error: { message: 'User not found' },
        });
        return;
      }

      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({
        error: { message: 'Failed to fetch user' },
      });
    }
  }

  /**
   * Create new user
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        res.status(400).json({
          error: { message: 'Name and email are required' },
        });
        return;
      }

      const id = String(this.users.size + 1);
      const user = { id, name, email };
      this.users.set(id, user);

      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({
        error: { message: 'Failed to create user' },
      });
    }
  }

  /**
   * Update user
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const user = this.users.get(id);
      if (!user) {
        res.status(404).json({
          error: { message: 'User not found' },
        });
        return;
      }

      const updatedUser = { ...user, ...updates, id };
      this.users.set(id, updatedUser);

      res.json({ success: true, data: updatedUser });
    } catch (error) {
      res.status(500).json({
        error: { message: 'Failed to update user' },
      });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!this.users.has(id)) {
        res.status(404).json({
          error: { message: 'User not found' },
        });
        return;
      }

      this.users.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        error: { message: 'Failed to delete user' },
      });
    }
  }
}

/**
 * Export factory function
 */
export const createUserService = (): UserService => {
  return new UserService();
};
