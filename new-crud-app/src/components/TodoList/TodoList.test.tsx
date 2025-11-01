import { render } from '@testing-library/react';
import TodoList from './TodoList';

describe('TodoList Component', () => {
  it('renders without crashing', () => {
    render(<TodoList />);
    // Add your test assertions here
  });
});
