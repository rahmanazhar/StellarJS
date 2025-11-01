const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const ora = require('ora');

async function deployProject(serverType, options) {
  const spinner = ora('Preparing deployment...').start();

  try {
    // Validate server type
    const supportedServers = ['hestiacp', 'apache', 'nginx', 'php'];
    if (!supportedServers.includes(serverType.toLowerCase())) {
      throw new Error(
        `Unsupported server type: ${serverType}. Supported: ${supportedServers.join(', ')}`
      );
    }

    // Build the project first
    spinner.text = 'Building project for production...';
    await buildForDeployment();

    // Generate server configurations
    spinner.text = 'Generating server configurations...';
    await generateServerConfigs(serverType.toLowerCase(), options);

    // Generate PHP backend if needed
    if (options.generatePhp) {
      spinner.text = 'Generating PHP backend...';
      await generatePhpBackend(options);
    }

    // Create deployment package
    spinner.text = 'Creating deployment package...';
    await createDeploymentPackage(serverType.toLowerCase(), options);

    spinner.succeed('Deployment package ready!');

    console.log(chalk.green('\n✨ Deployment prepared successfully!\n'));
    console.log('Next steps:');
    console.log(chalk.cyan(`1. Upload the contents of ./deploy/${serverType} to your server`));
    console.log(chalk.cyan('2. Configure your web server using the generated config files'));
    console.log(chalk.cyan('3. Set up the database if using PHP backend'));
  } catch (error) {
    spinner.fail('Deployment preparation failed');
    throw error;
  }
}

async function buildForDeployment() {
  try {
    // Build the frontend
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    // If no build script exists, use webpack directly
    try {
      const webpackConfig = await generateWebpackConfig();
      execSync(`npx webpack --config ${webpackConfig}`, { stdio: 'inherit' });
    } catch (webpackError) {
      throw new Error(
        'Failed to build project. Ensure you have a build script or webpack configuration.'
      );
    }
  }
}

async function generateServerConfigs(serverType, options) {
  const configDir = path.join(process.cwd(), 'deploy', serverType);
  await fs.mkdir(configDir, { recursive: true });

  switch (serverType) {
    case 'apache':
      await generateApacheConfig(configDir, options);
      break;
    case 'nginx':
      await generateNginxConfig(configDir, options);
      break;
    case 'hestiacp':
      await generateHestiaCPConfig(configDir, options);
      break;
    case 'php':
      await generateGenericPhpConfig(configDir, options);
      break;
  }
}

async function generateApacheConfig(configDir, options) {
  const domain = options.domain || 'example.com';
  const documentRoot = options.documentRoot || '/var/www/html';

  const apacheConfig = `<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}
    DocumentRoot ${documentRoot}
    
    # Enable rewrite engine for SPA routing
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    
    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/plain
        AddOutputFilterByType DEFLATE text/html
        AddOutputFilterByType DEFLATE text/xml
        AddOutputFilterByType DEFLATE text/css
        AddOutputFilterByType DEFLATE application/xml
        AddOutputFilterByType DEFLATE application/xhtml+xml
        AddOutputFilterByType DEFLATE application/rss+xml
        AddOutputFilterByType DEFLATE application/javascript
        AddOutputFilterByType DEFLATE application/x-javascript
    </IfModule>
    
    # Cache static assets
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/svg+xml "access plus 1 year"
    </IfModule>
    
    # API routes (if using PHP backend)
    ${
      options.generatePhp
        ? `
    Alias /api ${documentRoot}/api
    <Directory "${documentRoot}/api">
        AllowOverride All
        Require all granted
    </Directory>`
        : ''
    }
    
    ErrorLog \${APACHE_LOG_DIR}/${domain}_error.log
    CustomLog \${APACHE_LOG_DIR}/${domain}_access.log combined
</VirtualHost>

# SSL Configuration (uncomment and configure for HTTPS)
# <VirtualHost *:443>
#     ServerName ${domain}
#     ServerAlias www.${domain}
#     DocumentRoot ${documentRoot}
#     
#     SSLEngine on
#     SSLCertificateFile /path/to/your/certificate.crt
#     SSLCertificateKeyFile /path/to/your/private.key
#     
#     # Same configuration as above
# </VirtualHost>`;

  await fs.writeFile(path.join(configDir, `${domain}.conf`), apacheConfig);

  // Create .htaccess file for additional configuration
  const htaccessContent = `# StellarJS Apache Configuration
RewriteEngine On

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

# Prevent access to sensitive files
<FilesMatch "\\.(json|md|yml|yaml)$">
    Order allow,deny
    Deny from all
</FilesMatch>`;

  await fs.writeFile(path.join(configDir, '.htaccess'), htaccessContent);
}

async function generateNginxConfig(configDir, options) {
  const domain = options.domain || 'example.com';
  const documentRoot = options.documentRoot || '/var/www/html';

  const nginxConfig = `server {
    listen 80;
    server_name ${domain} www.${domain};
    root ${documentRoot};
    index index.html index.php;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static assets caching
    location ~* \\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    ${
      options.generatePhp
        ? `
    # API routes (PHP backend)
    location /api {
        try_files $uri $uri/ /api/index.php?$query_string;
    }
    
    # PHP processing
    location ~ \\.php$ {
        try_files $uri =404;
        fastcgi_split_path_info ^(.+\\.php)(/.+)$;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }`
        : ''
    }
    
    # Client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security - deny access to sensitive files
    location ~ /\\. {
        deny all;
    }
    
    location ~* \\.(json|md|yml|yaml)$ {
        deny all;
    }
    
    # Logs
    access_log /var/log/nginx/${domain}_access.log;
    error_log /var/log/nginx/${domain}_error.log;
}

# SSL Configuration (uncomment and configure for HTTPS)
# server {
#     listen 443 ssl http2;
#     server_name ${domain} www.${domain};
#     root ${documentRoot};
#     index index.html index.php;
#     
#     ssl_certificate /path/to/your/certificate.crt;
#     ssl_certificate_key /path/to/your/private.key;
#     
#     # Same configuration as above
# }`;

  await fs.writeFile(path.join(configDir, `${domain}.conf`), nginxConfig);
}

async function generateHestiaCPConfig(configDir, options) {
  const domain = options.domain || 'example.com';

  // HestiaCP uses both Apache and Nginx configurations
  await generateApacheConfig(configDir, options);
  await generateNginxConfig(configDir, options);

  // Generate HestiaCP specific instructions
  const hestiaCPInstructions = `# HestiaCP Deployment Instructions

## 1. Upload Files
Upload the contents of the 'public' directory to:
/home/[username]/web/${domain}/public_html/

## 2. Configure Web Server
1. Copy ${domain}.conf (nginx) to: /home/[username]/conf/web/nginx.${domain}.conf
2. Copy ${domain}.conf (apache) to: /home/[username]/conf/web/apache2.${domain}.conf
3. Copy .htaccess to: /home/[username]/web/${domain}/public_html/.htaccess

## 3. Database Setup (if using PHP backend)
${
  options.generatePhp
    ? `
1. Create a new database in HestiaCP panel
2. Import the database.sql file
3. Update the database configuration in api/config/database.php
`
    : 'No database setup required (static deployment)'
}

## 4. SSL Certificate
Enable SSL certificate in HestiaCP panel for automatic HTTPS configuration.

## 5. Restart Services
v-restart-web [username]

## File Permissions
Make sure the following directories are writable:
${
  options.generatePhp
    ? `
- /home/[username]/web/${domain}/public_html/api/storage/
- /home/[username]/web/${domain}/public_html/api/cache/
`
    : 'No special permissions needed for static files'
}
`;

  await fs.writeFile(path.join(configDir, 'DEPLOYMENT_INSTRUCTIONS.txt'), hestiaCPInstructions);
}

async function generateGenericPhpConfig(configDir, options) {
  // Generate both Apache and Nginx configs for flexibility
  await generateApacheConfig(configDir, options);
  await generateNginxConfig(configDir, options);

  const instructions = `# Generic PHP Server Deployment

Choose the appropriate configuration file based on your web server:

## Apache
- Use: ${options.domain || 'example.com'}.conf (Apache version)
- Copy .htaccess to your document root

## Nginx  
- Use: ${options.domain || 'example.com'}.conf (Nginx version)
- Add to your Nginx sites-available and create symlink to sites-enabled

## Upload Files
Upload all files from the 'public' directory to your web server's document root.

${
  options.generatePhp
    ? `
## Database
1. Create a MySQL/MariaDB database
2. Import database.sql
3. Update api/config/database.php with your database credentials
`
    : ''
}
`;

  await fs.writeFile(path.join(configDir, 'README.txt'), instructions);
}

async function generatePhpBackend(options) {
  const apiDir = path.join(process.cwd(), 'deploy', 'api');
  await fs.mkdir(apiDir, { recursive: true });

  // Generate PHP API structure and files
  await generatePhpApiFiles(apiDir, options);
}

async function generatePhpApiFiles(apiDir, options) {
  // Create directory structure
  const dirs = ['config', 'controllers', 'models', 'middleware', 'storage', 'cache'];
  for (const dir of dirs) {
    await fs.mkdir(path.join(apiDir, dir), { recursive: true });
  }

  // Generate main index.php
  const indexPhp = `<?php
// StellarJS PHP Backend
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
require_once 'config/routes.php';

// Simple router
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove /api prefix if present
$path = str_replace('/api', '', parse_url($requestUri, PHP_URL_PATH));

// Route the request
try {
    $router = new Router();
    $router->handleRequest($requestMethod, $path);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>`;

  await fs.writeFile(path.join(apiDir, 'index.php'), indexPhp);

  // Generate database configuration
  const databasePhp = `<?php
// Database Configuration
class Database {
    private $host = 'localhost';
    private $db_name = '${options.database || 'stellar_db'}';
    private $username = '${options.dbUser || 'root'}';
    private $password = '${options.dbPassword || ''}';
    private $conn;
    
    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo json_encode(['error' => 'Connection error: ' . $exception->getMessage()]);
        }
        
        return $this->conn;
    }
}
?>`;

  await fs.writeFile(path.join(apiDir, 'config/database.php'), databasePhp);

  // Generate simple router
  const routesPhp = `<?php
// Simple Router Class
class Router {
    private $routes = [];
    
    public function __construct() {
        // Define your API routes here
        $this->routes = [
            'GET' => [
                '/health' => [$this, 'health'],
                '/users' => 'UserController@index',
                '/users/([0-9]+)' => 'UserController@show'
            ],
            'POST' => [
                '/users' => 'UserController@store',
                '/auth/login' => 'AuthController@login'
            ],
            'PUT' => [
                '/users/([0-9]+)' => 'UserController@update'
            ],
            'DELETE' => [
                '/users/([0-9]+)' => 'UserController@delete'
            ]
        ];
    }
    
    public function handleRequest($method, $path) {
        if (!isset($this->routes[$method])) {
            $this->notFound();
            return;
        }
        
        foreach ($this->routes[$method] as $route => $handler) {
            if (preg_match('#^' . $route . '$#', $path, $matches)) {
                array_shift($matches); // Remove full match
                
                if (is_callable($handler)) {
                    call_user_func_array($handler, $matches);
                } else {
                    $this->callController($handler, $matches);
                }
                return;
            }
        }
        
        $this->notFound();
    }
    
    private function callController($handler, $params) {
        list($controller, $method) = explode('@', $handler);
        $controllerFile = __DIR__ . '/controllers/' . $controller . '.php';
        
        if (file_exists($controllerFile)) {
            require_once $controllerFile;
            $controllerInstance = new $controller();
            call_user_func_array([$controllerInstance, $method], $params);
        } else {
            $this->notFound();
        }
    }
    
    public function health() {
        echo json_encode([
            'status' => 'ok',
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '1.0.0'
        ]);
    }
    
    private function notFound() {
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
    }
}
?>`;

  await fs.writeFile(path.join(apiDir, 'config/routes.php'), routesPhp);

  // Generate sample controller
  const userControllerPhp = `<?php
require_once __DIR__ . '/../config/database.php';

class UserController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    public function index() {
        $query = "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($users);
    }
    
    public function show($id) {
        $query = "SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo json_encode($user);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
        }
    }
    
    public function store() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Name and email are required']);
            return;
        }
        
        $query = "INSERT INTO users (name, email, created_at) VALUES (?, ?, NOW())";
        $stmt = $this->db->prepare($query);
        
        if ($stmt->execute([$data['name'], $data['email']])) {
            $userId = $this->db->lastInsertId();
            echo json_encode([
                'id' => $userId,
                'name' => $data['name'],
                'email' => $data['email'],
                'message' => 'User created successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create user']);
        }
    }
    
    public function update($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "UPDATE users SET name = ?, email = ? WHERE id = ?";
        $stmt = $this->db->prepare($query);
        
        if ($stmt->execute([$data['name'], $data['email'], $id])) {
            echo json_encode(['message' => 'User updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update user']);
        }
    }
    
    public function delete($id) {
        $query = "DELETE FROM users WHERE id = ?";
        $stmt = $this->db->prepare($query);
        
        if ($stmt->execute([$id])) {
            echo json_encode(['message' => 'User deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete user']);
        }
    }
}
?>`;

  await fs.writeFile(path.join(apiDir, 'controllers/UserController.php'), userControllerPhp);

  // Generate database schema
  const databaseSql = `-- StellarJS Database Schema
CREATE DATABASE IF NOT EXISTS ${options.database || 'stellar_db'};
USE ${options.database || 'stellar_db'};

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Insert sample data
INSERT INTO users (name, email) VALUES 
('John Doe', 'john@example.com'),
('Jane Smith', 'jane@example.com');
`;

  await fs.writeFile(path.join(apiDir, 'database.sql'), databaseSql);
}

async function createDeploymentPackage(serverType, options) {
  const deployDir = path.join(process.cwd(), 'deploy', serverType);
  const publicDir = path.join(deployDir, 'public');

  // Create public directory
  await fs.mkdir(publicDir, { recursive: true });

  // Copy built files
  const buildDir = path.join(process.cwd(), 'build') || path.join(process.cwd(), 'dist');

  try {
    await fs.access(buildDir);
    execSync(`cp -r ${buildDir}/* ${publicDir}/`, { stdio: 'inherit' });
  } catch (error) {
    // If no build directory, copy src files and create basic index.html
    await createBasicBuild(publicDir);
  }

  // Copy API files if generated
  if (options.generatePhp) {
    const apiSourceDir = path.join(process.cwd(), 'deploy', 'api');
    const apiDestDir = path.join(publicDir, 'api');
    execSync(`cp -r ${apiSourceDir} ${apiDestDir}`, { stdio: 'inherit' });
  }
}

async function createBasicBuild(publicDir) {
  // Create a basic index.html if no build exists
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StellarJS App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 2rem; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 1rem; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌟 StellarJS App</h1>
            <p>Your app is ready for deployment!</p>
        </div>
        
        <div class="warning">
            <h3>⚠️ Build Required</h3>
            <p>This is a placeholder. Please build your React application first:</p>
            <code>npm run build</code>
        </div>
        
        <div id="root"></div>
    </div>
    
    <script>
        // Basic check for React app
        if (typeof React !== 'undefined') {
            console.log('React app loaded successfully!');
        } else {
            console.log('Please build your React application for production.');
        }
    </script>
</body>
</html>`;

  await fs.writeFile(path.join(publicDir, 'index.html'), indexHtml);
}

async function generateWebpackConfig() {
  const webpackConfigPath = path.join(process.cwd(), 'webpack.deploy.js');

  const webpackConfig = `const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'static/js/[name].[contenthash:8].js',
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};`;

  await fs.writeFile(webpackConfigPath, webpackConfig);
  return webpackConfigPath;
}

module.exports = {
  deployProject,
};
