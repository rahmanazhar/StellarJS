import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'StellarJS',
  description:
    'A modern fullstack JavaScript framework combining React with microservices architecture',

  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'GitHub', link: 'https://github.com/rahmanazhar/StellarJS' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is StellarJS?', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Project Structure', link: '/guide/project-structure' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Architecture Overview', link: '/guide/architecture' },
            { text: 'Services', link: '/guide/services' },
            { text: 'Authentication', link: '/guide/authentication' },
            { text: 'Routing', link: '/guide/routing' },
            { text: 'State Management', link: '/guide/state-management' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Custom Services', link: '/guide/custom-services' },
            { text: 'Middleware', link: '/guide/middleware' },
            { text: 'Testing', link: '/guide/testing' },
            { text: 'Deployment', link: '/guide/deployment' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'Core API',
          items: [
            { text: 'StellarApp', link: '/api/stellar-app' },
            { text: 'StellarServer', link: '/api/stellar-server' },
            { text: 'Authentication', link: '/api/authentication' },
          ],
        },
        {
          text: 'Hooks',
          items: [
            { text: 'useService', link: '/api/use-service' },
            { text: 'useAuth', link: '/api/use-auth' },
          ],
        },
        {
          text: 'CLI',
          items: [
            { text: 'Commands', link: '/api/cli-commands' },
            { text: 'Configuration', link: '/api/cli-config' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Basic Examples',
          items: [
            { text: 'Todo App', link: '/examples/todo-app' },
            { text: 'Authentication', link: '/examples/auth-example' },
            { text: 'Custom Service', link: '/examples/custom-service' },
          ],
        },
        {
          text: 'Advanced Examples',
          items: [
            { text: 'Microservices', link: '/examples/microservices' },
            { text: 'Real-time Chat', link: '/examples/chat-app' },
            { text: 'File Upload', link: '/examples/file-upload' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/rahmanazhar/StellarJS' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present Rahman Azhar',
    },
  },
});
