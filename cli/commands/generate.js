const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

async function generateComponent(name, options) {
  const spinner = ora('Generating component...').start();

  try {
    const componentDir = options.path || 'src/components';
    const componentPath = path.join(process.cwd(), componentDir, name);

    // Create component directory
    await fs.mkdir(componentPath, { recursive: true });

    // Create component files
    await Promise.all([
      createComponentFile(componentPath, name, options),
      createStyleFile(componentPath, name, options),
      createTestFile(componentPath, name, options),
    ]);

    spinner.succeed(`Component ${chalk.bold(name)} generated successfully!`);
  } catch (error) {
    spinner.fail('Failed to generate component');
    throw error;
  }
}

async function generateService(name, options) {
  const spinner = ora('Generating service...').start();

  try {
    const serviceDir = options.path || 'src/services';
    const servicePath = path.join(process.cwd(), serviceDir, name);

    // Create service directory
    await fs.mkdir(servicePath, { recursive: true });

    // Create service files
    await Promise.all([
      createServiceFile(servicePath, name),
      createServiceTypesFile(servicePath, name),
      createServiceTestFile(servicePath, name),
    ]);

    spinner.succeed(`Service ${chalk.bold(name)} generated successfully!`);
  } catch (error) {
    spinner.fail('Failed to generate service');
    throw error;
  }
}

async function createComponentFile(componentPath, name, options = {}) {
  const isPhpComponent = options.php || options.crud;
  const componentContent = isPhpComponent
    ? createPhpComponentContent(name)
    : createBasicComponentContent(name);

  await fs.writeFile(path.join(componentPath, `${name}.tsx`), componentContent.trim());
}

function createBasicComponentContent(name) {
  return `
import React from 'react';
import './${name}.css';

interface ${name}Props {
  // Define your props here
}

export const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div className="${name.toLowerCase()}">
      {/* Component content */}
    </div>
  );
};

export default ${name};
`;
}

function createPhpComponentContent(name) {
  const resourceName = name.replace(/List$|Table$|Grid$/, '').toLowerCase();

  return `
import React, { useState, useEffect } from 'react';
import { useStellarPhp } from '../../utils/php-client';
import './${name}.css';

interface ${name}Props {
  // Define your props here
}

interface ${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} {
  id: number;
  name: string;
  email?: string;
  created_at: string;
  updated_at?: string;
}

export const ${name}: React.FC<${name}Props> = (props) => {
  const [data, setData] = useState<${
    resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const phpClient = useStellarPhp();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await phpClient.findAll('${resourceName}s');
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await phpClient.remove('${resourceName}s', id);
      setData(data.filter(item => item.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="${name.toLowerCase()}">
        <div className="${name.toLowerCase()}__loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="${name.toLowerCase()}">
        <div className="${name.toLowerCase()}__error">
          Error: {error}
          <button onClick={handleRefresh} style={{ marginLeft: '1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="${name.toLowerCase()}">
      <div className="${name.toLowerCase()}__header">
        <h2>${name}</h2>
        <button onClick={handleRefresh}>Refresh</button>
      </div>
      
      {data.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <div className="${name.toLowerCase()}__list">
          {data.map((item) => (
            <div key={item.id} className="${name.toLowerCase()}__item">
              <div className="${name.toLowerCase()}__item-content">
                <h3>{item.name}</h3>
                {item.email && <p>Email: {item.email}</p>}
                <small>Created: {new Date(item.created_at).toLocaleDateString()}</small>
              </div>
              <div className="${name.toLowerCase()}__item-actions">
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="${name.toLowerCase()}__delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ${name};
`;
}

async function createStyleFile(componentPath, name, options = {}) {
  const isPhpComponent = options.php || options.crud;

  const styleContent = isPhpComponent
    ? createPhpComponentStyles(name)
    : createBasicComponentStyles(name);

  await fs.writeFile(path.join(componentPath, `${name}.css`), styleContent.trim());
}

function createBasicComponentStyles(name) {
  return `
.${name.toLowerCase()} {
  /* Component styles */
}
`;
}

function createPhpComponentStyles(name) {
  return `
.${name.toLowerCase()} {
  padding: 1rem;
}

.${name.toLowerCase()}__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.${name.toLowerCase()}__loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.${name.toLowerCase()}__error {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.${name.toLowerCase()}__list {
  display: grid;
  gap: 1rem;
}

.${name.toLowerCase()}__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}

.${name.toLowerCase()}__item-content h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.${name.toLowerCase()}__item-content p {
  margin: 0 0 0.25rem 0;
  color: #666;
}

.${name.toLowerCase()}__item-content small {
  color: #999;
}

.${name.toLowerCase()}__item-actions {
  display: flex;
  gap: 0.5rem;
}

.${name.toLowerCase()}__delete-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.${name.toLowerCase()}__delete-btn:hover {
  background: #c82333;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

button:hover {
  background: #0056b3;
}
`;
}

async function createTestFile(componentPath, name, options = {}) {
  const isPhpComponent = options.php || options.crud;

  const testContent = `
import React from 'react';
import { render, screen } from '@testing-library/react';
import ${name} from './${name}';

${
  isPhpComponent
    ? `
// Mock the PHP client
jest.mock('../../utils/php-client', () => ({
  useStellarPhp: () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(() => Promise.resolve([])),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  })
}));
`
    : ''
}

describe('${name} Component', () => {
  it('renders without crashing', () => {
    render(<${name} />);
    // Add your test assertions here
  });
  
  ${
    isPhpComponent
      ? `
  it('displays loading state initially', () => {
    render(<${name} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
  `
      : ''
  }
});
`;

  await fs.writeFile(path.join(componentPath, `${name}.test.tsx`), testContent.trim());
}

async function createServiceFile(servicePath, name) {
  const serviceContent = `
import { ${name}Types } from './${name}.types';

export class ${name}Service {
  constructor(private config: any) {}

  // Add your service methods here
  async getData(): Promise<${name}Types.Response> {
    try {
      // Implement your service logic
      return {
        success: true,
        data: {}
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export factory function
export const create${name}Service = (config: any): ${name}Service => {
  return new ${name}Service(config);
};
`;

  await fs.writeFile(path.join(servicePath, `${name}Service.ts`), serviceContent.trim());
}

async function createServiceTypesFile(servicePath, name) {
  const typesContent = `
export namespace ${name}Types {
  export interface Config {
    // Define your service configuration
  }

  export interface Response {
    success: boolean;
    data?: any;
    error?: string;
  }

  // Add more type definitions as needed
}
`;

  await fs.writeFile(path.join(servicePath, `${name}.types.ts`), typesContent.trim());
}

async function createServiceTestFile(servicePath, name) {
  const testContent = `
import { ${name}Service } from './${name}Service';

describe('${name}Service', () => {
  let service: ${name}Service;

  beforeEach(() => {
    service = new ${name}Service({});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more test cases here
});
`;

  await fs.writeFile(path.join(servicePath, `${name}Service.test.ts`), testContent.trim());
}

module.exports = {
  generateComponent,
  generateService,
};
