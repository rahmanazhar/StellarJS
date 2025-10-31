import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TodoService } from './TodoService';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Initialize TodoService
const todoService = new TodoService();

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'StellarJS CRUD API is running' });
});

// Routes
app.get('/api/todos', (req: Request, res: Response) => todoService.getAllTodos(req, res));
app.get('/api/todos/stats', (req: Request, res: Response) => todoService.getStats(req, res));
app.get('/api/todos/:id', (req: Request, res: Response) => todoService.getTodoById(req, res));
app.post('/api/todos', (req: Request, res: Response) => todoService.createTodo(req, res));
app.put('/api/todos/:id', (req: Request, res: Response) => todoService.updateTodo(req, res));
app.patch('/api/todos/:id/toggle', (req: Request, res: Response) => todoService.toggleTodo(req, res));
app.delete('/api/todos/:id', (req: Request, res: Response) => todoService.deleteTodo(req, res));
app.delete('/api/todos', (req: Request, res: Response) => todoService.deleteCompleted(req, res));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 StellarJS CRUD API Server is running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📝 API Endpoints:`);
  console.log(`   GET    /api/todos          - Get all todos`);
  console.log(`   GET    /api/todos/stats    - Get statistics`);
  console.log(`   GET    /api/todos/:id      - Get a specific todo`);
  console.log(`   POST   /api/todos          - Create a new todo`);
  console.log(`   PUT    /api/todos/:id      - Update a todo`);
  console.log(`   PATCH  /api/todos/:id/toggle - Toggle completion`);
  console.log(`   DELETE /api/todos/:id      - Delete a todo`);
  console.log(`   DELETE /api/todos          - Delete completed todos\n`);
});
