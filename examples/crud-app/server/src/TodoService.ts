import { Request, Response } from 'express';

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Todo Service - Complete CRUD implementation
 */
export class TodoService {
  private todos: Map<string, Todo>;
  private nextId: number;

  constructor() {
    this.todos = new Map();
    this.nextId = 1;

    // Add some sample todos
    this.seedData();
  }

  /**
   * Seed initial data
   */
  private seedData(): void {
    const sampleTodos: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        title: 'Learn StellarJS',
        description: 'Complete the StellarJS tutorial and examples',
        completed: false,
      },
      {
        title: 'Build a fullstack app',
        description: 'Create a complete application using StellarJS framework',
        completed: false,
      },
      {
        title: 'Deploy to production',
        description: 'Deploy the application to a production server',
        completed: false,
      },
    ];

    sampleTodos.forEach((todo) => {
      const id = String(this.nextId++);
      this.todos.set(id, {
        ...todo,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  /**
   * GET /todos - Get all todos
   */
  async getAllTodos(req: Request, res: Response): Promise<void> {
    try {
      const { completed } = req.query;
      let todos = Array.from(this.todos.values());

      // Filter by completed status if provided
      if (completed !== undefined) {
        const isCompleted = completed === 'true';
        todos = todos.filter((todo) => todo.completed === isCompleted);
      }

      // Sort by creation date (newest first)
      todos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      res.json({
        success: true,
        data: todos,
        count: todos.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch todos',
      });
    }
  }

  /**
   * GET /todos/:id - Get todo by ID
   */
  async getTodoById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const todo = this.todos.get(id);

      if (!todo) {
        res.status(404).json({
          success: false,
          error: 'Todo not found',
        });
        return;
      }

      res.json({
        success: true,
        data: todo,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch todo',
      });
    }
  }

  /**
   * POST /todos - Create new todo
   */
  async createTodo(req: Request, res: Response): Promise<void> {
    try {
      const { title, description } = req.body;

      // Validation
      if (!title || title.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Title is required',
        });
        return;
      }

      const id = String(this.nextId++);
      const now = new Date();

      const newTodo: Todo = {
        id,
        title: title.trim(),
        description: description?.trim() || '',
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      this.todos.set(id, newTodo);

      res.status(201).json({
        success: true,
        data: newTodo,
        message: 'Todo created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create todo',
      });
    }
  }

  /**
   * PUT /todos/:id - Update todo
   */
  async updateTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, completed } = req.body;

      const todo = this.todos.get(id);
      if (!todo) {
        res.status(404).json({
          success: false,
          error: 'Todo not found',
        });
        return;
      }

      // Update fields
      const updatedTodo: Todo = {
        ...todo,
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(completed !== undefined && { completed: Boolean(completed) }),
        updatedAt: new Date(),
      };

      this.todos.set(id, updatedTodo);

      res.json({
        success: true,
        data: updatedTodo,
        message: 'Todo updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update todo',
      });
    }
  }

  /**
   * PATCH /todos/:id/toggle - Toggle todo completion
   */
  async toggleTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const todo = this.todos.get(id);

      if (!todo) {
        res.status(404).json({
          success: false,
          error: 'Todo not found',
        });
        return;
      }

      const updatedTodo: Todo = {
        ...todo,
        completed: !todo.completed,
        updatedAt: new Date(),
      };

      this.todos.set(id, updatedTodo);

      res.json({
        success: true,
        data: updatedTodo,
        message: `Todo marked as ${updatedTodo.completed ? 'completed' : 'incomplete'}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to toggle todo',
      });
    }
  }

  /**
   * DELETE /todos/:id - Delete todo
   */
  async deleteTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!this.todos.has(id)) {
        res.status(404).json({
          success: false,
          error: 'Todo not found',
        });
        return;
      }

      this.todos.delete(id);

      res.json({
        success: true,
        message: 'Todo deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete todo',
      });
    }
  }

  /**
   * DELETE /todos - Delete all completed todos
   */
  async deleteCompleted(req: Request, res: Response): Promise<void> {
    try {
      const completedIds: string[] = [];

      this.todos.forEach((todo, id) => {
        if (todo.completed) {
          completedIds.push(id);
        }
      });

      completedIds.forEach((id) => this.todos.delete(id));

      res.json({
        success: true,
        message: `Deleted ${completedIds.length} completed todo(s)`,
        count: completedIds.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete completed todos',
      });
    }
  }

  /**
   * GET /todos/stats - Get statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const allTodos = Array.from(this.todos.values());
      const completed = allTodos.filter((t) => t.completed).length;
      const incomplete = allTodos.length - completed;

      res.json({
        success: true,
        data: {
          total: allTodos.length,
          completed,
          incomplete,
          completionRate: allTodos.length > 0 ? Math.round((completed / allTodos.length) * 100) : 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stats',
      });
    }
  }
}

/**
 * Export factory function
 */
export const createTodoService = (): TodoService => {
  return new TodoService();
};
