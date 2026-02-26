import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthConfig, AuthUser } from '../../types';
import { UserModel } from './UserModel';

export class AuthService {
  constructor(private config: AuthConfig) {
    if (!config.jwtSecret) {
      throw new Error('JWT secret is required for AuthService');
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Fetch user including password field (excluded by default via select: false)
      const user = await UserModel.findOne({
        email: email.toLowerCase(),
        isActive: true,
      }).select('+password');

      // Use a generic message to prevent user enumeration
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      user.lastLogin = new Date();
      await user.save();

      const token = this.generateToken({
        id: user.id,
        email: user.email,
        roles: user.roles,
      });

      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, roles: user.roles },
      });
    } catch (error) {
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const existing = await UserModel.findOne({ email: email.toLowerCase() });
      if (existing) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      // Password is hashed automatically via the pre-save hook in UserModel
      const user = await UserModel.create({ email: email.toLowerCase(), password, name });

      const token = this.generateToken({
        id: user.id,
        email: user.email,
        roles: user.roles,
      });

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: { id: user.id, email: user.email, name: user.name, roles: user.roles },
      });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  public async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const user = await UserModel.findOne({ email: email.toLowerCase() });

      // Always return success to prevent user enumeration
      if (!user) {
        res.json({ message: 'If that email exists, a reset link has been sent' });
        return;
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      await user.save();

      // Applications should send resetToken via email; returned here for integration testing
      res.json({
        message: 'If that email exists, a reset link has been sent',
        resetToken,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process password reset' });
    }
  }

  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({ error: 'Token and new password are required' });
        return;
      }

      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const user = await UserModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        res.status(400).json({ error: 'Invalid or expired reset token' });
        return;
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }

  public authenticateToken(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Authentication token required' });
      return;
    }

    try {
      const user = jwt.verify(token, this.config.jwtSecret) as AuthUser;
      (req as any).user = user;
      next();
    } catch (error) {
      res.status(403).json({ error: 'Invalid or expired token' });
    }
  }

  private generateToken(user: Partial<AuthUser>): string {
    return jwt.sign(user, this.config.jwtSecret, {
      expiresIn: this.config.tokenExpiration || '24h',
    });
  }

  public requireRoles(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user as AuthUser;

      if (!user?.roles) {
        res.status(403).json({ error: 'User has no roles assigned' });
        return;
      }

      const hasRequiredRole = roles.some((role) => user.roles?.includes(role));
      if (!hasRequiredRole) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    };
  }
}

export const createAuthService = (config: AuthConfig): AuthService => {
  return new AuthService(config);
};

export const createAuthMiddleware = (authService: AuthService) => {
  return authService.authenticateToken.bind(authService);
};
