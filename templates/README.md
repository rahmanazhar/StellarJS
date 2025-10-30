# StellarJS Templates

This directory contains project templates used by the StellarJS CLI.

## Available Templates

### Basic Template
Located in `basic/` - A minimal StellarJS application with:
- React frontend with routing
- Express backend with StellarJS server
- Basic authentication setup
- Example pages (Home, About)
- Development and build configurations

## Template Structure

```
basic/
├── public/           # Static files
├── server/           # Backend code
│   └── index.ts      # Server entry point
└── src/              # Frontend code
    ├── pages/        # Page components
    ├── styles/       # CSS files
    ├── App.tsx       # Main app component
    ├── Router.tsx    # Route configuration
    └── index.tsx     # Entry point
```

## Usage

Templates are automatically used when creating a new project:

```bash
npx stellar-js create my-app
# or
stellar create my-app
```

## Creating Custom Templates

To create a custom template:

1. Create a new directory in `templates/`
2. Add the project structure
3. Update the CLI to reference the new template
4. Templates support placeholders that are replaced during project creation

## Template Files

- `.env.example` - Environment variable template
- `.gitignore` - Git ignore rules
- Source files with example code
- Configuration files (TypeScript, package.json, etc.)
