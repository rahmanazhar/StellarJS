import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthConfig, AuthUser } from '../../types';

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

      // Note: In a real implementation, you would:
      // 1. Fetch user from database
      // 2. Verify password with bcrypt.compare
      // This is a simplified example
      
      const token = this.generateToken({ id: '1', email });
      
      res.json({
        token,
        user: { email }
      });
    } catch (error) {
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Note: In a real implementation, you would:
      // 1. Check if user exists
      // 2. Save user to database
      // This is a simplified example

      const token = this.generateToken({ id: '1', email });

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: { email }
      });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
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
      res.status(403).json({ error: 'Invalid token' });
    }
  }

  private generateToken(user: Partial<AuthUser>): string {
    return jwt.sign(
      user,
      this.config.jwtSecret,
      { expiresIn: this.config.tokenExpiration || '24h' }
    );
  }

  // Middleware factory for role-based authorization
  public requireRoles(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user as AuthUser;
      
      if (!user.roles) {
        res.status(403).json({ error: 'User has no roles assigned' });
        return;
      }

      const hasRequiredRole = roles.some(role => user.roles?.includes(role));
      
      if (!hasRequiredRole) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    };
  }
}

// Export factory function
export const createAuthService = (config: AuthConfig): AuthService => {
  return new AuthService(config);
};

// Export middleware factory
export const createAuthMiddleware = (authService: AuthService) => {
  return authService.authenticateToken.bind(authService);
};
