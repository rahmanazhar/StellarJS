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
      createComponentFile(componentPath, name),
      createStyleFile(componentPath, name),
      createTestFile(componentPath, name),
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

async function createComponentFile(componentPath, name) {
  const componentContent = `
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

  await fs.writeFile(path.join(componentPath, `${name}.tsx`), componentContent.trim());
}

async function createStyleFile(componentPath, name) {
  const styleContent = `
.${name.toLowerCase()} {
  /* Component styles */
}
`;

  await fs.writeFile(path.join(componentPath, `${name}.css`), styleContent.trim());
}

async function createTestFile(componentPath, name) {
  const testContent = `
import React from 'react';
import { render, screen } from '@testing-library/react';
import ${name} from './${name}';

describe('${name} Component', () => {
  it('renders without crashing', () => {
    render(<${name} />);
    // Add your test assertions here
  });
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
