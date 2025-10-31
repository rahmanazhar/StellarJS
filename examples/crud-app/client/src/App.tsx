import React, { useState, useEffect } from 'react';
import './App.css';

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  completed: number;
  incomplete: number;
  completionRate: number;
}

const API_URL = 'http://localhost:3001/api';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Fetch todos
  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        filter === 'all'
          ? `${API_URL}/todos`
          : `${API_URL}/todos?completed=${filter === 'completed'}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setTodos(data.data);
      } else {
        setError(data.error || 'Failed to fetch todos');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/todos/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Create todo
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewTitle('');
        setNewDescription('');
        fetchTodos();
        fetchStats();
      } else {
        setError(data.error || 'Failed to create todo');
      }
    } catch (err) {
      setError('Failed to create todo');
      console.error('Error creating todo:', err);
    }
  };

  // Update todo
  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) return;

    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEditingId(null);
        setEditTitle('');
        setEditDescription('');
        fetchTodos();
      } else {
        setError(data.error || 'Failed to update todo');
      }
    } catch (err) {
      setError('Failed to update todo');
      console.error('Error updating todo:', err);
    }
  };

  // Toggle todo
  const handleToggle = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}/toggle`, {
        method: 'PATCH',
      });

      const data = await response.json();
      if (data.success) {
        fetchTodos();
        fetchStats();
      } else {
        setError(data.error || 'Failed to toggle todo');
      }
    } catch (err) {
      setError('Failed to toggle todo');
      console.error('Error toggling todo:', err);
    }
  };

  // Delete todo
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;

    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchTodos();
        fetchStats();
      } else {
        setError(data.error || 'Failed to delete todo');
      }
    } catch (err) {
      setError('Failed to delete todo');
      console.error('Error deleting todo:', err);
    }
  };

  // Delete completed
  const handleDeleteCompleted = async () => {
    if (!window.confirm('Delete all completed todos?')) return;

    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchTodos();
        fetchStats();
      } else {
        setError(data.error || 'Failed to delete completed todos');
      }
    } catch (err) {
      setError('Failed to delete completed todos');
      console.error('Error deleting completed todos:', err);
    }
  };

  // Start editing
  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  // Load data on mount and filter change
  useEffect(() => {
    fetchTodos();
    fetchStats();
  }, [filter]);

  return (
    <div className="app">
      <header className="header">
        <h1>⭐ StellarJS CRUD Example</h1>
        <p>Todo Application with Full CRUD Operations</p>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.incomplete}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.completionRate}%</span>
            <span className="stat-label">Progress</span>
          </div>
        </div>
      )}

      {/* Create Form */}
      <div className="create-form">
        <h2>Create New Todo</h2>
        <form onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Todo title *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
          />
          <button type="submit" className="btn-primary">
            Add Todo
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          All
        </button>
        <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>
          Active
        </button>
        <button
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        {stats && stats.completed > 0 && (
          <button className="btn-danger-outline" onClick={handleDeleteCompleted}>
            Clear Completed
          </button>
        )}
      </div>

      {/* Todo List */}
      <div className="todo-list">
        {loading ? (
          <div className="loading">Loading todos...</div>
        ) : todos.length === 0 ? (
          <div className="empty">
            {filter === 'all' ? 'No todos yet. Create one above!' : `No ${filter} todos.`}
          </div>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              {editingId === todo.id ? (
                <div className="todo-edit">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                  />
                  <div className="todo-actions">
                    <button className="btn-success" onClick={() => handleUpdate(todo.id)}>
                      Save
                    </button>
                    <button className="btn-secondary" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="todo-content">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo.id)}
                    />
                    <div className="todo-text">
                      <h3>{todo.title}</h3>
                      {todo.description && <p>{todo.description}</p>}
                      <small>Created: {new Date(todo.createdAt).toLocaleString()}</small>
                    </div>
                  </div>
                  <div className="todo-actions">
                    <button className="btn-edit" onClick={() => startEdit(todo)}>
                      Edit
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(todo.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
