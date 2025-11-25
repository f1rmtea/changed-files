import { ConfigError, GitHubAPIError, ValidationError } from '../src/errors';

describe('Custom Errors', () => {
  describe('ConfigError', () => {
    it('should create error with correct name and message', () => {
      const error = new ConfigError('Invalid configuration');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ConfigError');
      expect(error.message).toBe('Invalid configuration');
    });

    it('should be catchable as ConfigError instance', () => {
      try {
        throw new ConfigError('Test error');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigError);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('GitHubAPIError', () => {
    it('should create error with correct name and message', () => {
      const error = new GitHubAPIError('API request failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('GitHubAPIError');
      expect(error.message).toBe('API request failed');
      expect(error.statusCode).toBeUndefined();
    });

    it('should store status code when provided', () => {
      const error = new GitHubAPIError('Not found', 404);
      
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
    });

    it('should handle various HTTP status codes', () => {
      const error401 = new GitHubAPIError('Unauthorized', 401);
      const error403 = new GitHubAPIError('Forbidden', 403);
      const error500 = new GitHubAPIError('Server error', 500);
      
      expect(error401.statusCode).toBe(401);
      expect(error403.statusCode).toBe(403);
      expect(error500.statusCode).toBe(500);
    });
  });

  describe('ValidationError', () => {
    it('should create error with correct name and message', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
    });

    it('should preserve stack trace', () => {
      const error = new ValidationError('Test validation error');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ValidationError');
    });
  });
});