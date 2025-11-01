import { TodoServiceService } from './TodoServiceService';

describe('TodoServiceService', () => {
  let service: TodoServiceService;

  beforeEach(() => {
    service = new TodoServiceService({});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more test cases here
});
