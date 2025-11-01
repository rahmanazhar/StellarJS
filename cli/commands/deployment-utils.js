const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const ora = require('ora');

async function uploadToServer(options) {
  const spinner = ora('Uploading to server...').start();

  try {
    // Validate required options
    if (!options.host || !options.username) {
      throw new Error('Host and username are required for upload');
    }

    const uploadMethod = options.method || 'sftp';
    const localPath = options.localPath || './deploy';
    const remotePath = options.remotePath || '/var/www/html';

    switch (uploadMethod.toLowerCase()) {
      case 'sftp':
        await uploadViaSFTP(options, localPath, remotePath);
        break;
      case 'ftp':
        await uploadViaFTP(options, localPath, remotePath);
        break;
      case 'rsync':
        await uploadViaRsync(options, localPath, remotePath);
        break;
      default:
        throw new Error(`Unsupported upload method: ${uploadMethod}`);
    }

    spinner.succeed('Upload completed successfully!');
  } catch (error) {
    spinner.fail('Upload failed');
    throw error;
  }
}

async function uploadViaSFTP(options, localPath, remotePath) {
  // Generate SFTP batch file
  const batchCommands = [`cd ${remotePath}`, `put -r ${localPath}/*`, 'quit'];

  const batchFile = path.join(process.cwd(), 'sftp_batch.txt');
  await fs.writeFile(batchFile, batchCommands.join('\\n'));

  try {
    const sftpCommand = `sftp -b ${batchFile} ${options.username}@${options.host}`;
    execSync(sftpCommand, { stdio: 'inherit' });
  } finally {
    // Clean up batch file
    await fs.unlink(batchFile).catch(() => {});
  }
}

async function uploadViaFTP(options, localPath, remotePath) {
  // Generate FTP script
  const ftpCommands = [
    `open ${options.host}`,
    options.username,
    options.password || '',
    'binary',
    `cd ${remotePath}`,
    `lcd ${localPath}`,
    'mput *',
    'quit',
  ];

  const ftpScript = path.join(process.cwd(), 'ftp_script.txt');
  await fs.writeFile(ftpScript, ftpCommands.join('\\n'));

  try {
    const ftpCommand = `ftp -s:${ftpScript}`;
    execSync(ftpCommand, { stdio: 'inherit' });
  } finally {
    // Clean up script file
    await fs.unlink(ftpScript).catch(() => {});
  }
}

async function uploadViaRsync(options, localPath, remotePath) {
  const rsyncCommand = `rsync -avz --progress ${localPath}/ ${options.username}@${options.host}:${remotePath}/`;
  execSync(rsyncCommand, { stdio: 'inherit' });
}

async function createDeploymentConfig(options) {
  const configPath = path.join(process.cwd(), 'stellar.deploy.json');

  const config = {
    servers: {
      production: {
        type: options.serverType || 'apache',
        host: options.host || 'your-server.com',
        username: options.username || 'username',
        remotePath: options.remotePath || '/var/www/html',
        domain: options.domain || 'example.com',
        uploadMethod: 'sftp',
        generatePhp: options.generatePhp || false,
        database: {
          name: options.database || 'stellar_db',
          user: options.dbUser || 'root',
          password: options.dbPassword || '',
        },
      },
      staging: {
        type: 'nginx',
        host: 'staging.your-server.com',
        username: 'username',
        remotePath: '/var/www/staging',
        domain: 'staging.example.com',
        uploadMethod: 'sftp',
        generatePhp: false,
      },
    },
    buildCommand: 'npm run build',
    excludeFiles: ['node_modules', '.git', '.env.local', '*.log', 'src', 'tests'],
  };

  await fs.writeFile(configPath, JSON.stringify(config, null, 2));

  console.log(chalk.green(`\\n✨ Created deployment configuration: ${configPath}`));
  console.log(chalk.cyan('\\nEdit this file to customize your deployment settings.\\n'));

  return config;
}

async function deployToEnvironment(environment) {
  const configPath = path.join(process.cwd(), 'stellar.deploy.json');

  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configContent);

    if (!config.servers[environment]) {
      throw new Error(`Environment '${environment}' not found in deployment configuration`);
    }

    const serverConfig = config.servers[environment];

    console.log(chalk.blue(`\\n🚀 Deploying to ${environment} environment...\\n`));

    // Build the project
    const spinner = ora('Building project...').start();
    execSync(config.buildCommand || 'npm run build', { stdio: 'inherit' });
    spinner.succeed('Build completed');

    // Generate server configurations
    const { deployProject } = require('./deploy');
    await deployProject(serverConfig.type, serverConfig);

    // Upload to server if configured
    if (serverConfig.host && serverConfig.username) {
      await uploadToServer(serverConfig);
    }

    console.log(chalk.green(`\\n✨ Successfully deployed to ${environment}!\\n`));
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(chalk.yellow('\\n⚠️  No deployment configuration found. Creating one...\\n'));
      await createDeploymentConfig({});
      console.log(chalk.cyan('Please edit stellar.deploy.json and run the deploy command again.'));
    } else {
      throw error;
    }
  }
}

async function generateHtaccessForSPA() {
  const htaccessContent = `# StellarJS Single Page Application Configuration
RewriteEngine On

# Handle client-side routing - redirect all requests to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api
RewriteRule . /index.html [L]

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # CORS for API calls (adjust origin as needed)
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Compression
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
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Cache Control
<IfModule mod_expires.c>
    ExpiresActive On
    
    # Cache static assets for 1 year
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    
    # Cache HTML for 1 hour
    ExpiresByType text/html "access plus 1 hour"
    
    # Don't cache service worker
    <Files "service-worker.js">
        ExpiresActive Off
        Header unset ETag
        Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires "Wed, 11 Jan 1984 05:00:00 GMT"
    </Files>
</IfModule>

# Security - Prevent access to sensitive files
<Files ".env*">
    Order allow,deny
    Deny from all
</Files>

<FilesMatch "\\.(json|md|yml|yaml|log)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Block access to directories
Options -Indexes`;

  return htaccessContent;
}

async function generateDockerConfiguration() {
  const dockerfileContent = `# StellarJS Docker Configuration
FROM php:8.1-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    git \\
    curl \\
    libpng-dev \\
    libonig-dev \\
    libxml2-dev \\
    zip \\
    unzip

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Enable Apache modules
RUN a2enmod rewrite headers expires deflate

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY ./deploy/public/ /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html \\
    && chmod -R 755 /var/www/html

# Copy custom Apache configuration
COPY ./deploy/apache/stellar.conf /etc/apache2/sites-available/000-default.conf

# Expose port 80
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]`;

  const dockerComposeContent = `version: '3.8'

services:
  web:
    build: .
    ports:
      - "80:80"
    volumes:
      - ./deploy/public:/var/www/html
    environment:
      - APACHE_DOCUMENT_ROOT=/var/www/html
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: stellar_db
      MYSQL_USER: stellar_user
      MYSQL_PASSWORD: stellar_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./deploy/api/database.sql:/docker-entrypoint-initdb.d/init.sql

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    environment:
      PMA_HOST: db
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: rootpassword
    ports:
      - "8080:80"
    depends_on:
      - db

volumes:
  mysql_data:`;

  return { dockerfileContent, dockerComposeContent };
}

module.exports = {
  uploadToServer,
  createDeploymentConfig,
  deployToEnvironment,
  generateHtaccessForSPA,
  generateDockerConfiguration,
};
