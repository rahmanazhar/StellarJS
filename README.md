# StellarJS Framework

<div align="center">
  <h1>⭐ StellarJS</h1>
  <p><strong>A modern fullstack JavaScript framework combining React with microservices architecture</strong></p>
  <p>
    <a href="https://github.com/rahmanazhar/StellarJS/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/rahmanazhar/StellarJS" alt="License">
    </a>
    <a href="https://www.npmjs.com/package/stellar-js">
      <img src="https://img.shields.io/npm/v/stellar-js" alt="npm version">
    </a>
    <a href="https://github.com/rahmanazhar/StellarJS/stargazers">
      <img src="https://img.shields.io/github/stars/rahmanazhar/StellarJS" alt="GitHub Stars">
    </a>
  </p>
</div>

## ✨ Features

- 🚀 **Integrated Frontend & Backend**: Seamlessly combine React frontend with Express-based microservices
- ⚡️ **Built-in Authentication**: Ready-to-use authentication service with JWT support
- 🎯 **TypeScript Support**: First-class TypeScript support out of the box
- 🔄 **Custom Hooks**: Powerful hooks for service integration and state management
- 🛠 **CLI Tools**: Efficient development workflow with project scaffolding and code generation
- 📦 **Microservices Architecture**: Built-in support for microservices development
- 🔒 **Security**: Built-in security features and middleware
- 🎨 **Customizable**: Flexible configuration and extensible architecture

## 🚀 Quick Start

```bash
# Create a new StellarJS project
npx stellar-js create my-app

# Navigate to project directory
cd my-app

# Start development server
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001) to see your app in action!

## 📚 Documentation

For detailed documentation, visit our [Documentation Site](https://stellarjs.dev):

- [Getting Started Guide](https://stellarjs.dev/guide/getting-started)
- [Core Concepts](https://stellarjs.dev/guide/architecture)
- [API Reference](https://stellarjs.dev/api/)
- [Examples](https://stellarjs.dev/examples/)

## 🌟 Example Usage

### Service Definition

```typescript
// Define your service
class UserService {
  async getUsers() {
    return [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
    ];
  }
}
```

### React Component

```typescript
// Use in components
function UserList() {
  const { data, loading } = useService('user', 'getUsers');

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## 🛠 CLI Commands

```bash
# Create new project
stellar create my-app

# Generate components/services
stellar generate component UserList
stellar generate service User

# Development
stellar dev

# Production build
stellar build
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 💬 Community

- [GitHub Discussions](https://github.com/rahmanazhar/StellarJS/discussions)
- [Discord Server](https://discord.gg/stellarjs)
- [Twitter](https://twitter.com/StellarJSdev)

## 📝 License

Copyright © 2023 [Rahman Azhar](https://github.com/rahmanazhar).
This project is [MIT](LICENSE) licensed.
