// Mock fs before importing anything that uses it
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
  promises: {
    access: jest.fn(),
    readFile: jest.fn()
  }
}));

import * as fs from 'fs';
import { loadConfig } from '../src/config/loader';
import { ConfigError } from '../src/errors';
import { ActionInputs } from '../src/types';

// Mock other dependencies
jest.mock('@actions/core');

// Cast to jest.Mock for type safety
const mockExistsSync = fs.existsSync as jest.Mock;
const mockReadFileSync = fs.readFileSync as jest.Mock;

describe('Config Loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
    mockReadFileSync.mockReset();
  });

  describe('loadConfig - inline configuration', () => {
    it('should load valid inline YAML configuration', async () => {
      const inputs: ActionInputs = {
        config: '.github/changed-areas.yml',
        config_inline: `
areas:
  backend:
    include:
      - "src/**/*.ts"
`,
        github_token: 'test-token',
        edge_cases: {
          merge_commit_strategy: 'first-parent',
          force_push_strategy: 'compare-default-branch',
          empty_commit_behavior: 'none',
          ignore_binary_files: false,
          strict_validation: false
        }
      };

      const config = await loadConfig(inputs);

      expect(config.areas).toBeDefined();
      expect(config.areas!.backend).toBeDefined();
      expect(config.areas!.backend.include).toEqual(['src/**/*.ts']);
    });

    it('should throw ConfigError for invalid inline YAML', async () => {
      const inputs: ActionInputs = {
        config: '.github/changed-areas.yml',
        config_inline: `
invalid yaml:
  - this is: [not: valid
`,
        github_token: 'test-token',
        edge_cases: {
          merge_commit_strategy: 'first-parent',
          force_push_strategy: 'compare-default-branch',
          empty_commit_behavior: 'none',
          ignore_binary_files: false,
          strict_validation: false
        }
      };

      await expect(loadConfig(inputs)).rejects.toThrow(ConfigError);
      await expect(loadConfig(inputs)).rejects.toThrow(/Failed to parse inline configuration/);
    });

    it('should prioritize inline config over file config', async () => {
      const inputs: ActionInputs = {
        config: '.github/changed-areas.yml',
        config_inline: `
areas:
  backend:
    include:
      - "inline/**"
`,
        github_token: 'test-token',
        edge_cases: {
          merge_commit_strategy: 'first-parent',
          force_push_strategy: 'compare-default-branch',
          empty_commit_behavior: 'none',
          ignore_binary_files: false,
          strict_validation: false
        }
      };

      const config = await loadConfig(inputs);

      expect(config.areas!.backend.include).toEqual(['inline/**']);
      expect(fs.existsSync).not.toHaveBeenCalled();
    });
  });

  describe('loadConfig - file configuration', () => {
    it('should load configuration from file when no inline config provided', async () => {
      const inputs: ActionInputs = {
        config: '.github/changed-areas.yml',
        github_token: 'test-token',
        edge_cases: {
          merge_commit_strategy: 'first-parent',
          force_push_strategy: 'compare-default-branch',
          empty_commit_behavior: 'none',
          ignore_binary_files: false,
          strict_validation: false
        }
      };

      const fileContent = `
areas:
  backend:
    include:
      - "src/**/*.ts"
`;

      // Set up the mocks for this test case
      mockExistsSync.mockImplementation((path: string) => path === '.github/changed-areas.yml');
      mockReadFileSync.mockImplementation((path: string) => {
        if (path === '.github/changed-areas.yml') {
          return fileContent;
        }
        throw new Error(`Unexpected file read: ${path}`);
      });

      const config = await loadConfig(inputs);

      expect(mockExistsSync).toHaveBeenCalledWith('.github/changed-areas.yml');
      expect(mockReadFileSync).toHaveBeenCalledWith('.github/changed-areas.yml', 'utf8');
      expect(config.areas!.backend.include).toEqual(['src/**/*.ts']);
    });

    it('should throw ConfigError when config file does not exist', async () => {
      const inputs: ActionInputs = {
        config: '.github/changed-areas.yml',
        github_token: 'test-token',
        edge_cases: {
          merge_commit_strategy: 'first-parent',
          force_push_strategy: 'compare-default-branch',
          empty_commit_behavior: 'none',
          ignore_binary_files: false,
          strict_validation: false
        }
      };

      // Make sure existsSync returns false for this test
      mockExistsSync.mockReturnValue(false);
      mockReadFileSync.mockReset();

      await expect(loadConfig(inputs)).rejects.toThrow(ConfigError);
      await expect(loadConfig(inputs)).rejects.toThrow(/Configuration file not found/);
      await expect(loadConfig(inputs)).rejects.toThrow(/Please create this file or provide inline configuration/);
    });

    it('should throw ConfigError for invalid YAML in file', async () => {
      const inputs: ActionInputs = {
        config: '.github/changed-areas.yml',
        github_token: 'test-token',
        edge_cases: {
          merge_commit_strategy: 'first-parent',
          force_push_strategy: 'compare-default-branch',
          empty_commit_behavior: 'none',
          ignore_binary_files: false,
          strict_validation: false
        }
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid: [yaml: content');

      await expect(loadConfig(inputs)).rejects.toThrow(ConfigError);
      await expect(loadConfig(inputs)).rejects.toThrow(/Failed to parse configuration file/);
    });
  });
});