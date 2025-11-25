export class ConfigError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ConfigError';
    }
  }
  
  export class GitHubAPIError extends Error {
    constructor(message: string, public statusCode?: number) {
      super(message);
      this.name = 'GitHubAPIError';
    }
  }
  
  export class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  }