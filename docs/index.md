---
layout: home

hero:
  name: "StellarJS"
  text: "Modern Fullstack Framework"
  tagline: A powerful React framework with integrated microservices architecture
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/rahmanazhar/StellarJS

features:
  - icon: ⚡️
    title: Integrated Frontend & Backend
    details: Seamlessly combine React frontend with Express-based microservices in a single project
  
  - icon: 🔒
    title: Built-in Authentication
    details: Ready-to-use authentication service with JWT support and role-based authorization
  
  - icon: 🎯
    title: TypeScript First
    details: Built from the ground up with TypeScript, providing excellent type safety and developer experience
  
  - icon: 🔄
    title: Custom Hooks
    details: Powerful React hooks for service integration and state management
  
  - icon: 🛠
    title: CLI Tools
    details: Boost productivity with project scaffolding and code generation tools
  
  - icon: 📦
    title: Microservices Ready
    details: First-class support for building and managing microservices architecture

  - icon: 🎨
    title: Customizable
    details: Flexible configuration and extensible architecture to meet your needs
  
  - icon: 🔍
    title: Developer Experience
    details: Hot reloading, debugging tools, and comprehensive documentation

---

## Quick Start

```bash
# Create a new StellarJS project
npx stellar-js create my-app

# Navigate to project directory
cd my-app

# Start development server
npm run dev
```

## Why StellarJS?

StellarJS is designed to solve common challenges in modern web development:

- **Unified Development**: No need to maintain separate frontend and backend codebases
- **Type Safety**: Built with TypeScript for better developer experience and fewer runtime errors
- **Scalable Architecture**: Microservices support for building large-scale applications
- **Developer Productivity**: CLI tools and generators for rapid development
- **Modern Stack**: Built on proven technologies like React and Express
- **Security First**: Built-in security features and best practices

## Features

### 🚀 Integrated Development

```typescript
// Define your service
class UserService {
  async getUsers() {
    // Implementation
  }
}

// Use in React components
function UserList() {
  const { data, loading } = useService('user', 'getUsers');
  
  if (loading) return <div>Loading...</div>;
  return <ul>{data.map(user => <li>{user.name}</li>)}</ul>;
}
```

### ⚡️ Built-in Authentication

```typescript
// Protected route
app.use('/api/protected', authService.authenticateToken);

// React component
function Login() {
  const { login } = useAuth();
  
  const handleLogin = async () => {
    await login(credentials);
  };
}
```

### 🎯 Type Safety

```typescript
interface UserService {
  getUsers(): Promise<User[]>;
  createUser(user: NewUser): Promise<User>;
}

// Type checking and autocompletion work seamlessly
const userService = createService<UserService>('user');
```

## Community

Join our community to get help, share your projects, and contribute:

- [GitHub Discussions](https://github.com/rahmanazhar/StellarJS/discussions)
- [Discord Server](https://discord.gg/stellarjs)
- [Twitter](https://twitter.com/StellarJSdev)

## Contributors

<a href="https://github.com/rahmanazhar/StellarJS/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rahmanazhar/StellarJS" />
</a>

## License

[MIT License](https://github.com/rahmanazhar/StellarJS/blob/main/LICENSE) © 2023-present Rahman Azhar
