# Changed Files

A GitHub Action for detecting changed files with flexible configuration - use simple file matching, area-based classification, or both together.

## Overview

Changed Files provides flexible file change detection for CI/CD workflows through a unified configuration approach:

- Use **`files:`** for simple file pattern matching
- Use **`areas:`** for organizing files into logical areas  
- Use **both together** in a single configuration

All configurations use consistent YAML syntax and handle Git edge cases (first commits, force pushes, empty commits, merge commits) with support for binary file detection, file extension filtering, and comprehensive validation.

## Quick Start

### Simple File Matching

Match changed files against patterns:

```yaml
- uses: f1rmtea/changed-files@main
  id: changed
  with:
    config_inline: |
      files:
        include:
          - "src/**/*.ts"
          - "tests/**/*.py"
        exclude:
          - "**/*.test.ts"

- name: Run tests
  if: steps.changed.outputs.files_changed == 'true'
  run: npm test
```

**Outputs**: `files_changed`, `files_files`, `files_count`

### Area-Based Classification

Classify files into multiple areas using a config file or inline configuration:

**Option 1: Using config file `.github/changed-areas.yml`:**
```yaml
areas:
  backend:
    include:
      - "src/backend/**"
    exclude:
      - "**/*.test.ts"
  
  frontend:
    include:
      - "src/frontend/**"
```

**Option 2: Using inline configuration:**
```yaml
- uses: f1rmtea/changed-files@main
  id: changes
  with:
    config_inline: |
      areas:
        backend:
          include:
            - "src/backend/**"
          exclude:
            - "**/*.test.ts"
        
        frontend:
          include:
            - "src/frontend/**"
```

**Use in workflow:**
```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.changes.outputs.backend_changed }}
      frontend: ${{ steps.changes.outputs.frontend_changed }}
    steps:
      - uses: actions/checkout@v4

      - id: changes
        uses: f1rmtea/changed-files@main

  test-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: npm test -- backend
```

**Outputs**: Per-area `{area}_changed`, `{area}_files`, `{area}_count`

### Combined Approach

Use both files and areas in a single configuration:

```yaml
- uses: f1rmtea/changed-files@main
  id: changes
  with:
    config_inline: |
      areas:
        backend:
          include:
            - "src/backend/**"
        frontend:
          include:
            - "src/frontend/**"
      
      files:
        include:
          - "Dockerfile"
          - "docker-compose.yml"

# All outputs available!
- if: steps.changes.outputs.backend_changed == 'true'
  run: npm test -- backend

- if: steps.changes.outputs.files_changed == 'true'
  run: docker-compose build
```

## Configuration

### Files Section

Simple file pattern matching:

```yaml
files:
  include:
    - "src/**/*.ts"
    - "tests/**/*.py"
  exclude:
    - "**/*.test.ts"
  required_extensions: [".ts", ".tsx"]
  exclude_binary_files: true
  min_changed_files: 1
```

### Areas Section

Multiple logical areas:

```yaml
areas:
  backend:
    include:
      - "src/backend/**"
      - "src/api/**"
    exclude:
      - "**/*.test.ts"
    required_extensions: [".ts", ".tsx"]
  
  frontend:
    include:
      - "src/frontend/**"
    required_extensions: [".tsx", ".ts", ".css"]
```

### Combined Configuration

Use both in the same config:

```yaml
areas:
  backend:
    include:
      - "src/backend/**"
  frontend:
    include:
      - "src/frontend/**"

files:
  include:
    - "Dockerfile"
    - "docker-compose.yml"
  exclude:
    - ".dockerignore"
```

### Configuration Options

Both `files` and each area support these options:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `include` | `string[]` | Yes | - | Glob patterns for files to match |
| `exclude` | `string[]` | No | `[]` | Glob patterns for files to exclude |
| `required_extensions` | `string[]` | No | - | Only match files with these extensions |
| `min_changed_files` | `number` | No | `1` | Minimum files required to trigger |
| `exclude_binary_files` | `boolean` | No | `false` | Exclude binary files |
| `ignore_deleted_files` | `boolean` | No | `false` | Ignore deleted files |
| `ignore_renamed_files` | `boolean` | No | `false` | Ignore renamed files that have no content changes (pure renames only) |

## Action Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `config` | No | `.github/changed-areas.yml` | Path to configuration file |
| `config_inline` | No | - | Inline YAML configuration (takes precedence over file) |
| `github_token` | No | `${{ github.token }}` | GitHub token for API access |
| `merge_commit_strategy` | No | `first-parent` | `first-parent` or `all-parents` |
| `force_push_strategy` | No | `compare-default-branch` | `compare-default-branch`, `all-files`, or `fail` |
| `empty_commit_behavior` | No | `none` | `none` or `all` |
| `ignore_binary_files` | No | `false` | Globally ignore binary files (overrides per-area settings) |
| `strict_validation` | No | `false` | Treat configuration warnings as errors |
| `debug` | No | `false` | Debug mode level: `false` (no debug), `true` (grouped per-file), or `verbose` (detailed per-section logs) |

## Action Outputs

### For Files Section

When `files:` is defined in configuration:
- `files_changed`: `"true"` or `"false"`
- `files_files`: Newline-separated list of matched files
- `files_count`: Number of matched files

### For Each Area

When `areas:` is defined, for each area `{area_name}`:
- `{area_name}_changed`: `"true"` or `"false"`
- `{area_name}_files`: Newline-separated list of matched files
- `{area_name}_count`: Number of matched files

### JSON Summary

- `areas_json`: Complete JSON object with all results

Example structure:
```json
{
  "backend": {
    "changed": true,
    "files": ["src/backend/api.ts"],
    "count": 1
  },
  "frontend": {
    "changed": false,
    "files": [],
    "count": 0
  },
  "files": {
    "changed": true,
    "files": ["Dockerfile", "docker-compose.yml"],
    "count": 2
  }
}
```

## Usage Examples

### Example 1: Simple File Check

Perfect for checking specific configuration files like Docker files or package manifests.

```yaml
- uses: f1rmtea/changed-files@main
  id: docker
  with:
    config_inline: |
      files:
        include:
          - "Dockerfile"
          - "docker-compose.yml"

- if: steps.docker.outputs.files_changed == 'true'
  run: docker-compose build
```

See [examples/basic-files-only.yml](examples/basic-files-only.yml) for a complete workflow example.

### Example 2: Multiple Simple Checks

Check different file types separately using multiple action calls. Each check can have its own include/exclude patterns.

See [examples/multiple-simple-checks.yml](examples/multiple-simple-checks.yml) for a complete workflow showing Python and TypeScript file checks.

### Example 3: Areas Only

Organize your monorepo into logical areas and run specific jobs based on which areas changed. This is perfect for monorepos with distinct backend, frontend, and infrastructure components.

```yaml
- uses: f1rmtea/changed-files@main
  id: changes
  with:
    config_inline: |
      areas:
        backend:
          include:
            - "src/backend/**"
          required_extensions: [".ts", ".js"]
        
        frontend:
          include:
            - "src/frontend/**"
          required_extensions: [".tsx", ".ts", ".css"]
```

See [examples/areas-only.yml](examples/areas-only.yml) for a complete workflow with conditional job execution.

### Example 4: Combined Configuration

The most powerful approach - combine area-based classification with simple file checks in a single action call. This lets you organize code into areas while also checking specific configuration files.

```yaml
- uses: f1rmtea/changed-files@main
  id: changes
  with:
    config_inline: |
      areas:
        backend:
          include:
            - "src/backend/**"
        frontend:
          include:
            - "src/frontend/**"
      
      files:
        include:
          - "Dockerfile"
          - "docker-compose.yml"
```

See [examples/combined.yml](examples/combined.yml) for a complete workflow showing how to use all outputs together.

### Example 5: Using Config File

For complex configurations, use an external YAML file instead of inline configuration. This makes your workflow cleaner and allows you to reuse the configuration across multiple workflows.

Create `.github/changed-config.yml` with your areas and files configuration, then reference it:

```yaml
- uses: f1rmtea/changed-files@main
  with:
    config: .github/changed-config.yml
```

See [examples/using-config-file.yml](examples/using-config-file.yml) and [examples/sample-config.yml](examples/sample-config.yml) for complete examples.

### Example 6: Matrix Strategy with JSON Output

Use the JSON output to dynamically create a test matrix. This is powerful for running tests only for areas that changed.

```yaml
jobs:
  detect-changes:
    outputs:
      matrix: ${{ steps.changes.outputs.areas_json }}
    steps:
      - id: changes
        uses: f1rmtea/changed-files@main

  test:
    needs: detect-changes
    strategy:
      matrix:
        area: [backend, frontend, api, workers]
    steps:
      - name: Check if area changed
        run: |
          CHANGED=$(echo '${{ needs.detect-changes.outputs.matrix }}' | jq -r '."${{ matrix.area }}".changed')
          echo "changed=$CHANGED" >> $GITHUB_OUTPUT
```

See [examples/matrix-strategy.yml](examples/matrix-strategy.yml) for the complete implementation.

### Example 7: Advanced Options

All configuration options (extension filtering, binary file exclusion, minimum file thresholds) are available for both `files` and `areas` sections:

```yaml
files:
  include:
    - "src/**/*.ts"
  exclude:
    - "**/*.test.ts"
  required_extensions: [".ts", ".tsx"]
  exclude_binary_files: true
  min_changed_files: 2
```

See [examples/advanced-options.yml](examples/advanced-options.yml) for a complete example.

## Matching Logic

For both `files` and each area, a file matches if:

1. It matches at least one pattern in `include`
2. AND it matches no patterns in `exclude`
3. AND (if `required_extensions` specified) its extension is in the list
4. AND (if `exclude_binary_files: true`) it's not a binary file
5. AND (if `ignore_deleted_files: true`) it's not deleted
6. AND (if `ignore_renamed_files: true`) it's not a pure rename (renamed files with content changes are still included)

After matching, the `min_changed_files` threshold is applied.

## Edge Cases

### First Commit

When pushing the first commit to a repository, all files in the commit are marked as changed.

### Force Push

Force pushes overwrite history. Behavior depends on `force_push_strategy`:

- `compare-default-branch` (default): Compare against the repository's default branch
- `all-files`: Mark all files in the pushed commit as changed
- `fail`: Fail the workflow with an error

### Empty Commit

Commits with no file changes. Behavior depends on `empty_commit_behavior`:

- `none` (default): Nothing is triggered (all `*_changed` outputs are false)
- `all`: Everything is triggered (all `*_changed` outputs are true)

### Merge Commits

Merge commits have multiple parents. Behavior depends on `merge_commit_strategy`:

- `first-parent` (default): Follow only the first parent
- `all-parents`: Include changes from all parents

## Complete Workflow Example

Here's a comprehensive example showing multiple features together:

```yaml
name: CI Pipeline

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.changes.outputs.backend_changed }}
      frontend: ${{ steps.changes.outputs.frontend_changed }}
      docker: ${{ steps.changes.outputs.files_changed }}
    steps:
      - uses: actions/checkout@v4

      - name: Detect all changes
        id: changes
        uses: f1rmtea/changed-files@main
        with:
          config_inline: |
            areas:
              backend:
                include:
                  - "src/backend/**"
                exclude:
                  - "**/*.test.ts"
              
              frontend:
                include:
                  - "src/frontend/**"
            
            files:
              include:
                - "Dockerfile"
                - "docker-compose.yml"

  test-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: npm test -- backend

  test-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: npm test -- frontend

  build-docker:
    needs: detect-changes
    if: needs.detect-changes.outputs.docker == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: docker-compose build
```

## Debug Mode

Debug mode helps troubleshoot pattern matching by showing why files matched or didn't match your configuration. The action supports three debug levels to balance verbosity with usefulness.

### Debug Levels

#### `debug: false` (Default)
No debug output. Only shows final match summaries.

```yaml
- uses: f1rmtea/changed-files@main
  with:
    debug: false  # or omit this line
    config_inline: |
      areas:
        backend:
          include:
            - "src/backend/**"
```

**Output:**
```
[backend] Matched 2 file(s)
[frontend] Matched 0 file(s)
```

#### `debug: true` (Grouped)
Shows matches and non-matches grouped by file. This is the recommended mode for troubleshooting - it's concise but informative.

```yaml
- uses: f1rmtea/changed-files@main
  with:
    debug: true
    config_inline: |
      areas:
        backend:
          include:
            - "src/backend/**"
          exclude:
            - "**/*.test.ts"
        frontend:
          include:
            - "src/frontend/**"
        python:
          include:
            - "**/*.py"
```

**Output:**
```
File: src/backend/api.ts
  -> Matches: backend (matched include "src/backend/**")
  -> Not matched: frontend, python

File: src/backend/api.test.ts
  -> Matches: none
  -> Not matched: backend, frontend, python

File: src/frontend/app.tsx
  -> Matches: frontend (matched include "src/frontend/**")
  -> Not matched: backend, python
```

#### `debug: verbose` (Detailed)
Shows detailed per-section logs for every file and every area. Use this only when you need to see the complete matching logic flow.

```yaml
- uses: f1rmtea/changed-files@main
  with:
    debug: verbose
    config_inline: |
      areas:
        backend:
          include:
            - "src/backend/**"
          exclude:
            - "**/*.test.ts"
```

**Output:**
```
[backend] src/backend/api.ts matched include "src/backend/**"
[backend] src/backend/api.ts did not match any exclude patterns
[frontend] src/backend/api.ts did not match any include patterns
[python] src/backend/api.ts did not match any include patterns

[backend] src/backend/api.test.ts matched include "src/backend/**"
[backend] src/backend/api.test.ts excluded by "**/*.test.ts"
[frontend] src/backend/api.test.ts did not match any include patterns
[python] src/backend/api.test.ts did not match any include patterns
```

### What Debug Mode Shows

Debug mode explains matching behavior including:

- **Include pattern matches** - Shows which pattern matched the file
- **Exclude behavior** - Shows if the file was excluded and which pattern excluded it
- **Extension filtering** - Shows when files are ignored due to `required_extensions`
- **Binary file handling** - Shows when files are ignored due to `exclude_binary_files`
- **Deleted file handling** - Shows when files are ignored due to `ignore_deleted_files`
- **Renamed file handling** - Shows when pure renames are ignored due to `ignore_renamed_files`
- **No match explanation** - Shows when files don't match any include patterns

### Choosing a Debug Level

- **`false`**: Production workflows where you only need final results
- **`true`**: Troubleshooting pattern matching - shows per-file summaries (recommended)
- **`verbose`**: Deep debugging - shows every decision for every area (very noisy)

## Troubleshooting

### Configuration Not Found

Ensure the configuration file exists or use inline configuration:

```yaml
- uses: f1rmtea/changed-files@main
  with:
    config: .github/my-config.yml  # Custom path
```

### No Files Matched

Check that:
1. Patterns use correct glob syntax
2. Patterns match actual file paths in repository

Enable debug mode to see detailed matching information:

```yaml
- uses: f1rmtea/changed-files@main
  id: debug
  with:
    debug: true
    config_inline: |
      files:
        include:
          - "**/*"
```

### Binary Files Not Excluded

Set the flag in configuration:

```yaml
files:
  include:
    - "src/**"
  exclude_binary_files: true
```

Or use the global flag:

```yaml
- uses: f1rmtea/changed-files@main
  with:
    config_inline: |
      files:
        include:
          - "src/**"
    ignore_binary_files: true
```

### Reserved Name "files"

The name "files" is reserved for the files section. Don't use it as an area name:

```yaml
# ❌ Invalid
areas:
  files:  # Error: "files" is reserved
    include: ...

# ✅ Valid
areas:
  file_processor:  # Different name
    include: ...
```

### Patterns Not Matching

Remember:
- Patterns are relative to repository root
- Use `**` for recursive directory matching
- Use `*` for single-level matching
- Patterns are case-sensitive by default

## Best Practices

1. **Start Simple**: Use `files:` for basic checks, add `areas:` as complexity grows
2. **Combine When Useful**: Use both `files:` and `areas:` in one config to consolidate checks
3. **Keep Patterns Simple**: Use broad include patterns and specific exclude patterns
4. **Use Config Files**: For complex configurations, use external YAML files
5. **Test Configuration**: Use `strict_validation: true` during setup to catch issues early
6. **Document Patterns**: Add comments to configuration files explaining each pattern's purpose

## Performance Considerations

- Optimized for monorepos with hundreds of files
- Pattern matching uses efficient glob libraries
- **Uses GitHub's REST API** - no git commands executed locally, works with any `fetch-depth`
- Single action call can check multiple areas and file patterns
- Configuration parsed once and reused
- All matching happens in parallel

### Shallow Clones

This action **does not require** `fetch-depth: 0`. It uses GitHub's API to fetch changed files, not local git commands:
- Pull requests: Uses `GET /repos/{owner}/{repo}/pulls/{number}/files`
- Push events: Uses `GET /repos/{owner}/{repo}/compare/{basehead}`

You can safely use shallow clones:
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 1  # Shallow clone works perfectly fine
```

Only use `fetch-depth: 0` if other steps in your workflow need full git history.

## Contributing

Contributions are welcome. Please:

1. Open an issue to discuss proposed changes
2. Follow the existing code style
3. Add tests for new functionality
4. Update documentation as needed

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or feature requests, please open an issue on GitHub.