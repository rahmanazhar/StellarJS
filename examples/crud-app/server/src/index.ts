import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createTodoService } from './TodoService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Create Todo service
const todoService = createTodoService();

// Routes
app.get('/api/todos', todoService.getAllTodos.bind(todoService));
app.get('/api/todos/stats', todoService.getStats.bind(todoService));
app.get('/api/todos/:id', todoService.getTodoById.bind(todoService));
app.post('/api/todos', todoService.createTodo.bind(todoService));
app.put('/api/todos/:id', todoService.updateTodo.bind(todoService));
app.patch('/api/todos/:id/toggle', todoService.toggleTodo.bind(todoService));
app.delete('/api/todos/:id', todoService.deleteTodo.bind(todoService));
app.delete('/api/todos', todoService.deleteCompleted.bind(todoService));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   StellarJS CRUD Example Server       ║
║   Running on http://localhost:${PORT}   ║
╚════════════════════════════════════════╝

Available endpoints:
  GET    /api/health
  GET    /api/todos
  GET    /api/todos/stats
  GET    /api/todos/:id
  POST   /api/todos
  PUT    /api/todos/:id
  PATCH  /api/todos/:id/toggle
  DELETE /api/todos/:id
  DELETE /api/todos (delete completed)
  `);
});

export default app;
