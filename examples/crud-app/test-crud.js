#!/usr/bin/env node

/**
 * Test script for StellarJS CRUD Example
 * Tests all CRUD operations via HTTP requests
 */

const http = require('http');

const API_URL = 'http://localhost:3001';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function test(name, testFn) {
  try {
    log(`\n→ Testing: ${name}`, 'blue');
    await testFn();
    log(`✓ PASSED: ${name}`, 'green');
    testsPassed++;
  } catch (error) {
    log(`✗ FAILED: ${name}`, 'red');
    log(`  Error: ${error.message}`, 'red');
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════╗', 'yellow');
  log('║  StellarJS CRUD Example - Test Suite  ║', 'yellow');
  log('╚════════════════════════════════════════╝\n', 'yellow');

  let createdTodoId;

  // Test 1: Health Check
  await test('Health Check', async () => {
    const { status, data } = await makeRequest('GET', '/api/health');
    assert(status === 200, `Expected status 200, got ${status}`);
    assert(data.success === true, 'Health check should return success');
  });

  // Test 2: Get All Todos
  await test('GET /api/todos - Get all todos', async () => {
    const { status, data } = await makeRequest('GET', '/api/todos');
    assert(status === 200, `Expected status 200, got ${status}`);
    assert(data.success === true, 'Should return success');
    assert(Array.isArray(data.data), 'Should return array of todos');
    assert(data.count >= 0, 'Should return count');
    log(`  Found ${data.count} todos`, 'blue');
  });

  // Test 3: Get Stats
  await test('GET /api/todos/stats - Get statistics', async () => {
    const { status, data } = await makeRequest('GET', '/api/todos/stats');
    assert(status === 200, `Expected status 200, got ${status}`);
    assert(data.success === true, 'Should return success');
    assert(typeof data.data.total === 'number', 'Should have total count');
    assert(typeof data.data.completed === 'number', 'Should have completed count');
    assert(typeof data.data.incomplete === 'number', 'Should have incomplete count');
    log(`  Stats: ${data.data.total} total, ${data.data.completed} completed`, 'blue');
  });

  // Test 4: Create Todo
  await test('POST /api/todos - Create new todo', async () => {
    const newTodo = {
      title: 'Test Todo from Script',
      description: 'This is a test todo created by the test script',
    };
    const { status, data } = await makeRequest('POST', '/api/todos', newTodo);
    assert(status === 201, `Expected status 201, got ${status}`);
    assert(data.success === true, 'Should return success');
    assert(data.data.id, 'Should return todo with ID');
    assert(data.data.title === newTodo.title, 'Title should match');
    assert(data.data.completed === false, 'Should be incomplete by default');
    createdTodoId = data.data.id;
    log(`  Created todo with ID: ${createdTodoId}`, 'blue');
  });

  // Test 5: Get Specific Todo
  await test('GET /api/todos/:id - Get todo by ID', async () => {
    const { status, data } = await makeRequest('GET', `/api/todos/${createdTodoId}`);
    assert(status === 200, `Expected status 200, got ${status}`);
    assert(data.success === true, 'Should return success');
    assert(data.data.id === createdTodoId, 'Should return correct todo');
  });

  // Test 6: Update Todo
  await test('PUT /api/todos/:id - Update todo', async () => {
    const updates = {
      title: 'Updated Test Todo',
      description: 'This todo has been updated',
    };
    const { status, data } = await makeRequest('PUT', `/api/todos/${createdTodoId}`, updates);
    assert(status === 200, `Expected status 200, got ${status}`);
    assert(data.success === true, 'Should return success');
    assert(data.data.title === updates.title, 'Title should be updated');
    assert(data.data.description === updates.description, 'Description should be updated');
    log(`  Updated todo ${createdTodoId}`, 'blue');
  });

  // Test 7: Toggle Todo
  await test('PATCH /api/todos/:id/toggle - Toggle completion', async () => {
    const { status, data } = await makeRequest('PATCH', `/api/todos/${createdTodoId}/toggle`);
    assert(status === 200, `Expected status 200, got ${status}`);
    assert(data.success === true, 'Should return success');
    assert(data.data.completed === true, 'Should be marked as completed');
    log(`  Toggled todo ${createdTodoId} to completed`, 'blue');
  });

  // Test 8: Filter Completed Todos
  await test('GET /api/todos?completed=true - Filter completed', async () => {
    const { status, data } = await makeRequest('GET', '/api/todos?completed=true');
    assert(status === 200, `Expected status 200, got ${status}`);
    assert(data.success === true, 'Should return success');
    assert(Array.isArray(data.data), 'Should return array');
    const allCompleted = data.data.every((todo) => todo.completed === true);
    assert(allCompleted, 'All todos should be completed');
    log(`  Found ${data.count} completed todos`, 'blue');
  });

  // Test 9: Filter Active Todos
  await test('GET /api/todos?completed=false - Filter active', async () => {
    const { status, data } = await makeRequest('GET', '/api/todos?completed=false');
    assert(status === 200, `Expected status 200, got ${status}`);
    assert(data.success === true, 'Should return success');
    const allIncomplete = data.data.every((todo) => todo.completed === false);
    assert(allIncomplete, 'All todos should be incomplete');
    log(`  Found ${data.count} active todos`, 'blue');
  });

  // Test 10: Delete Todo
  await test('DELETE /api/todos/:id - Delete todo', async () => {
    const { status, data } = await makeRequest('DELETE', `/api/todos/${createdTodoId}`);
    assert(status === 200, `Expected status 200, got ${status}`);
    assert(data.success === true, 'Should return success');
    log(`  Deleted todo ${createdTodoId}`, 'blue');
  });

  // Test 11: Verify Delete
  await test('Verify todo is deleted', async () => {
    const { status, data } = await makeRequest('GET', `/api/todos/${createdTodoId}`);
    assert(status === 404, `Expected status 404, got ${status}`);
    assert(data.success === false, 'Should return failure');
  });

  // Test 12: Delete Completed Todos
  await test('DELETE /api/todos - Delete all completed', async () => {
    const { status, data } = await makeRequest('DELETE', '/api/todos');
    assert(status === 200, `Expected status 200, got ${status}`);
    assert(data.success === true, 'Should return success');
    log(`  Deleted ${data.count} completed todos`, 'blue');
  });

  // Test 13: Error Handling - Invalid Todo ID
  await test('Error handling - Get non-existent todo', async () => {
    const { status, data } = await makeRequest('GET', '/api/todos/999999');
    assert(status === 404, `Expected status 404, got ${status}`);
    assert(data.success === false, 'Should return failure');
  });

  // Test 14: Validation - Empty Title
  await test('Validation - Create todo without title', async () => {
    const { status, data } = await makeRequest('POST', '/api/todos', { description: 'No title' });
    assert(status === 400, `Expected status 400, got ${status}`);
    assert(data.success === false, 'Should return failure');
  });

  // Results
  log('\n╔════════════════════════════════════════╗', 'yellow');
  log('║          Test Results                  ║', 'yellow');
  log('╚════════════════════════════════════════╝', 'yellow');
  log(`\nTests Passed: ${testsPassed}`, 'green');
  log(`Tests Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log(`Total Tests:  ${testsPassed + testsFailed}\n`);

  if (testsFailed === 0) {
    log('🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('❌ Some tests failed!', 'red');
    process.exit(1);
  }
}

// Check if server is running
log('Checking if server is running...', 'blue');
makeRequest('GET', '/api/health')
  .then(() => {
    log('✓ Server is running\n', 'green');
    runTests();
  })
  .catch(() => {
    log('✗ Server is not running!', 'red');
    log('\nPlease start the server first:', 'yellow');
    log('  cd examples/crud-app/server', 'blue');
    log('  npm install', 'blue');
    log('  npm run dev\n', 'blue');
    process.exit(1);
  });
