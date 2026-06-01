---
name: testing-unit
description: Unit testing patterns with Jest, Vitest, pytest including mocking, TDD, and test coverage strategies
tags: [testing, unit-test, jest, vitest, pytest, tdd]
author: Antigravity Team
version: 1.0.0
---

# Unit Testing Skill

Comprehensive unit testing patterns.

## Jest/Vitest (JavaScript)

### Basic Tests
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('UserService', () => {
  let userService;
  let mockDb;

  beforeEach(() => {
    mockDb = {
      users: {
        findById: vi.fn(),
        create: vi.fn()
      }
    };
    userService = new UserService(mockDb);
  });

  describe('getUser', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 1, name: 'John' };
      mockDb.users.findById.mockResolvedValue(mockUser);

      const result = await userService.getUser(1);

      expect(result).toEqual(mockUser);
      expect(mockDb.users.findById).toHaveBeenCalledWith(1);
    });

    it('should throw when user not found', async () => {
      mockDb.users.findById.mockResolvedValue(null);

      await expect(userService.getUser(999))
        .rejects.toThrow('User not found');
    });
  });
});
```

### Mocking
```javascript
// Mock modules
vi.mock('./api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'test' })
}));

// Mock timers
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();

// Spy on methods
const spy = vi.spyOn(console, 'log');
myFunction();
expect(spy).toHaveBeenCalledWith('expected message');

// Mock implementations
mockFn.mockImplementation((x) => x * 2);
mockFn.mockImplementationOnce(() => 'first call');
```

### Async Testing
```javascript
it('handles async operations', async () => {
  const promise = fetchData();
  
  // Fast-forward timers
  await vi.runAllTimersAsync();
  
  const result = await promise;
  expect(result).toBeDefined();
});

it('handles errors', async () => {
  const errorFn = async () => { throw new Error('Failed'); };
  
  await expect(errorFn()).rejects.toThrow('Failed');
});
```

## Pytest (Python)

### Basic Tests
```python
import pytest
from unittest.mock import Mock, patch, AsyncMock

class TestUserService:
    @pytest.fixture
    def user_service(self):
        db = Mock()
        return UserService(db)
    
    def test_get_user_success(self, user_service):
        user_service.db.find_by_id.return_value = {"id": 1, "name": "John"}
        
        result = user_service.get_user(1)
        
        assert result["name"] == "John"
        user_service.db.find_by_id.assert_called_once_with(1)
    
    def test_get_user_not_found(self, user_service):
        user_service.db.find_by_id.return_value = None
        
        with pytest.raises(UserNotFoundError):
            user_service.get_user(999)

# Parametrized tests
@pytest.mark.parametrize("input,expected", [
    (1, 1),
    (2, 4),
    (3, 9),
])
def test_square(input, expected):
    assert square(input) == expected

# Async tests
@pytest.mark.asyncio
async def test_async_function():
    result = await async_fetch()
    assert result is not None
```

### Fixtures
```python
@pytest.fixture
def db_session():
    session = create_test_session()
    yield session
    session.rollback()
    session.close()

@pytest.fixture(scope="module")
def api_client():
    return TestClient(app)

# Conftest.py for shared fixtures
# conftest.py
@pytest.fixture(autouse=True)
def reset_database():
    yield
    clear_all_tables()
```

## TDD Workflow

```
1. Write failing test (Red)
2. Write minimal code to pass (Green)
3. Refactor (Refactor)
4. Repeat
```

## Coverage

```bash
# Vitest
vitest --coverage

# Pytest
pytest --cov=myapp --cov-report=html

# Target: 80%+ line coverage, 100% critical paths
```

## Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **One assertion per test** (ideally)
3. **Test behavior, not implementation**
4. **Mock external dependencies**
5. **Use descriptive test names**
