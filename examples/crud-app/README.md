# StellarJS CRUD Example

A complete CRUD (Create, Read, Update, Delete) application demonstrating the capabilities of the StellarJS framework.

## Features

### Backend (Express Server)
- ✅ Full CRUD operations for Todo items
- ✅ RESTful API design
- ✅ Request logging
- ✅ Error handling
- ✅ Statistics endpoint
- ✅ Filter by completion status
- ✅ Toggle completion
- ✅ Bulk delete completed items

### Frontend (React)
- ✅ Create new todos
- ✅ View all todos
- ✅ Update existing todos
- ✅ Delete todos
- ✅ Toggle completion status
- ✅ Filter by status (all/active/completed)
- ✅ Real-time statistics
- ✅ Responsive design
- ✅ Beautiful UI with gradients

## Project Structure

```
crud-app/
├── server/                 # Backend Express server
│   ├── TodoService.ts      # Todo CRUD service
│   ├── index.ts           # Server entry point
│   ├── package.json
│   └── tsconfig.json
└── client/                 # Frontend React app
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.tsx        # Main React component
    │   ├── App.css        # Styles
    │   └── index.tsx      # Entry point
    ├── package.json
    └── tsconfig.json
```

## API Endpoints

### Todos
- `GET /api/todos` - Get all todos (supports ?completed=true/false filter)
- `GET /api/todos/:id` - Get todo by ID
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `PATCH /api/todos/:id/toggle` - Toggle completion status
- `DELETE /api/todos/:id` - Delete todo
- `DELETE /api/todos` - Delete all completed todos

### Stats
- `GET /api/todos/stats` - Get statistics (total, completed, incomplete, completion rate)

### Health
- `GET /api/health` - Server health check

## Installation & Running

### Backend Server

```bash
cd examples/crud-app/server
npm install
npm run dev
```

Server will run on http://localhost:3001

### Frontend Client

```bash
cd examples/crud-app/client
npm install
npm start
```

Client will run on http://localhost:3000

## Testing the Application

### Manual Testing
1. Start the backend server
2. Start the frontend client
3. Open http://localhost:3000 in your browser
4. Try the following operations:
   - Create a new todo
   - Mark a todo as complete
   - Edit a todo
   - Delete a todo
   - Filter by status
   - Clear completed todos

### API Testing with curl

```bash
# Get all todos
curl http://localhost:3001/api/todos

# Get stats
curl http://localhost:3001/api/todos/stats

# Create todo
curl -X POST http://localhost:3001/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Todo","description":"Testing the API"}'

# Get specific todo
curl http://localhost:3001/api/todos/1

# Update todo
curl -X PUT http://localhost:3001/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","description":"Updated description"}'

# Toggle completion
curl -X PATCH http://localhost:3001/api/todos/1/toggle

# Delete todo
curl -X DELETE http://localhost:3001/api/todos/1

# Delete completed
curl -X DELETE http://localhost:3001/api/todos
```

## Screenshots

The application features:
- Modern gradient design (purple to blue)
- Clean, card-based layout
- Real-time statistics dashboard
- Inline editing for todos
- Smooth animations and transitions
- Fully responsive design

## Technologies Used

### Backend
- Express.js
- TypeScript
- CORS
- dotenv

### Frontend
- React 18
- TypeScript
- CSS3 (with gradients and animations)
- Fetch API for HTTP requests

## Features Demonstrated

1. **Create (POST)** - Add new todos with title and description
2. **Read (GET)** - Fetch all todos or individual todo by ID
3. **Update (PUT)** - Edit todo title and description
4. **Delete (DELETE)** - Remove individual or bulk delete completed
5. **Additional Operations**:
   - Toggle completion status (PATCH)
   - Filter by status (query parameters)
   - Statistics calculation

## Data Model

```typescript
interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

The application includes comprehensive error handling:
- Input validation
- 404 for not found resources
- 500 for server errors
- User-friendly error messages
- Error state management in UI

## Future Enhancements

Potential improvements:
- [ ] Add persistent storage (MongoDB/PostgreSQL)
- [ ] User authentication
- [ ] Todo categories/tags
- [ ] Due dates and reminders
- [ ] Search functionality
- [ ] Pagination for large datasets
- [ ] Drag and drop reordering
- [ ] Dark mode toggle

## License

MIT
