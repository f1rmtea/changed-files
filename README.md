# Changed Files

A GitHub Action for detecting and classifying changed files in monorepos. Enables efficient CI/CD workflows by running tests and builds only for affected areas.

## Overview

Changed Files analyzes file changes in pull requests and push events, then classifies them into configurable areas. This allows workflows to selectively execute jobs based on which parts of the codebase have changed, reducing CI time and resource consumption.

## Key Features

### Area-Based Classification
Define logical areas of your codebase with include and exclude patterns. Files are matched against these patterns to determine which areas have been affected by changes.

### File Extension Filtering
Restrict area matches to specific file types using the `required_extensions` option. Useful for separating code changes from documentation or configuration updates.

### Comprehensive Outputs
Each area provides three outputs:
- Boolean flag indicating if the area changed
- Newline-separated list of changed files
- Count of changed files

Additionally, a JSON summary output provides all results in a structured format for advanced use cases.

### Edge Case Handling
Handles common Git edge cases automatically:
- First commits to a repository
- Force pushes
- Empty commits
- Merge commits with configurable strategies

### Binary File Detection
Automatically detects binary files and provides options to exclude them from area matching, either globally or per-area.

### Configuration Validation
Validates configuration before execution and provides actionable error messages with suggested fixes. Supports strict mode to treat warnings as errors.

### Flexible Configuration
Configure areas using either:
- External YAML file (default: `.github/changed-areas.yml`)
- Inline YAML in workflow definition

## Installation

Reference the action in your workflow:

```yaml
- uses: f1rmtea/changed-files@main
```

## Quick Start

### Step 1: Define Areas

Create `.github/changed-areas.yml` in your repository:

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
      - "src/components/**"
    exclude:
      - "**/*.test.tsx"
      - "**/*.stories.tsx"

  infrastructure:
    include:
      - "terraform/**"
      - ".github/workflows/**"
      - "docker/**"
```

### Step 2: Create Workflow

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      backend_changed: ${{ steps.changes.outputs.backend_changed }}
      frontend_changed: ${{ steps.changes.outputs.frontend_changed }}
      infrastructure_changed: ${{ steps.changes.outputs.infrastructure_changed }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Detect changed areas
        id: changes
        uses: f1rmtea/changed-files@main

  test-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend_changed == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run backend tests
        run: npm test -- backend

  test-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend_changed == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run frontend tests
        run: npm test -- frontend
```

## Configuration Reference

### Area Configuration

Each area in the `areas` object supports the following options:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `include` | `string[]` | Yes | - | Glob patterns for files to include in this area |
| `exclude` | `string[]` | No | `[]` | Glob patterns for files to exclude from this area |
| `required_extensions` | `string[]` | No | - | Only match files with these extensions (e.g., `[".ts", ".tsx"]`) |
| `min_changed_files` | `number` | No | `1` | Minimum number of changed files required to trigger the area |
| `exclude_binary_files` | `boolean` | No | `false` | Exclude binary files from matching this area |
| `ignore_deleted_files` | `boolean` | No | `false` | Ignore deleted files when matching this area |
| `ignore_renamed_files` | `boolean` | No | `false` | Ignore renamed files when matching this area |

### Action Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `config` | `string` | No | `.github/changed-areas.yml` | Path to configuration file |
| `config_inline` | `string` | No | - | Inline YAML configuration (takes precedence over file) |
| `github_token` | `string` | No | `${{ github.token }}` | GitHub token for API access |
| `merge_commit_strategy` | `string` | No | `first-parent` | Strategy for merge commits: `first-parent` or `all-parents` |
| `force_push_strategy` | `string` | No | `compare-default-branch` | Strategy for force pushes: `compare-default-branch`, `all-files`, or `fail` |
| `empty_commit_behavior` | `string` | No | `none` | Behavior for empty commits: `none` or `all` |
| `ignore_binary_files` | `boolean` | No | `false` | Globally ignore binary files across all areas |
| `strict_validation` | `boolean` | No | `false` | Treat configuration warnings as errors |

### Action Outputs

#### Per-Area Outputs

For each configured area, the action sets three outputs:

- `{area_name}_changed`: `"true"` or `"false"`
- `{area_name}_files`: Newline-separated list of changed file paths
- `{area_name}_count`: Number of changed files as a string

#### JSON Summary Output

- `areas_json`: Complete JSON object containing all area results

Example structure:
```json
{
  "backend": {
    "changed": true,
    "files": ["src/api/users.ts", "src/api/auth.ts"],
    "count": 2
  },
  "frontend": {
    "changed": false,
    "files": [],
    "count": 0
  }
}
```

## Matching Logic

A file is classified to an area if all of the following conditions are met:

1. The file path matches **at least one** pattern in the `include` list
2. The file path matches **none** of the patterns in the `exclude` list (if specified)
3. The file extension is in the `required_extensions` list (if specified)
4. The file is not binary, or binary files are not excluded for this area
5. The file is not deleted, or deleted files are not ignored for this area
6. The file is not renamed, or renamed files are not ignored for this area

After classification, the area's `min_changed_files` threshold is applied. The area is considered "changed" only if the number of matched files meets or exceeds this threshold.

## Edge Cases

### First Commit

When a repository's first commit is pushed, there is no previous commit to compare against. The action marks all files in the commit as changed.

### Force Push

Force pushes overwrite Git history, making standard diff comparison unreliable. The action handles this based on the `force_push_strategy` input:

- `compare-default-branch` (default): Compares the pushed commit against the repository's default branch
- `all-files`: Marks all files in the pushed commit as changed
- `fail`: Fails the workflow with an error, requiring manual intervention

### Empty Commit

Commits with no file changes can occur in various scenarios. The action handles this based on the `empty_commit_behavior` input:

- `none` (default): No areas are marked as changed
- `all`: All configured areas are marked as changed

### Merge Commits

Merge commits have multiple parents. The action handles this based on the `merge_commit_strategy` input:

- `first-parent` (default): Follows only the first parent (the branch being merged into)
- `all-parents`: Includes changes from all parents

## Usage Examples

### Inline Configuration

For simpler workflows, define configuration directly in the workflow file:

```yaml
- name: Detect changed areas
  id: changes
  uses: f1rmtea/changed-files@main
  with:
    config_inline: |
      areas:
        backend:
          include:
            - "src/backend/**"
        frontend:
          include:
            - "src/frontend/**"
```

### Matrix Strategy with JSON Output

Use the JSON output to dynamically build test matrices:

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      areas: ${{ steps.changes.outputs.areas_json }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Detect changes
        id: changes
        uses: f1rmtea/changed-files@main

  test:
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix:
        area: [backend, frontend, api, workers]
    steps:
      - uses: actions/checkout@v4
      
      - name: Check if area changed
        id: check
        run: |
          AREAS='${{ needs.detect-changes.outputs.areas }}'
          CHANGED=$(echo $AREAS | jq -r '."${{ matrix.area }}".changed')
          echo "changed=$CHANGED" >> $GITHUB_OUTPUT
      
      - name: Run tests
        if: steps.check.outputs.changed == 'true'
        run: npm run test:${{ matrix.area }}
```

### Extension-Specific Areas

Separate code changes from documentation:

```yaml
areas:
  code:
    include:
      - "src/**"
    required_extensions: [".ts", ".tsx", ".js", ".jsx"]
    exclude_binary_files: true

  documentation:
    include:
      - "docs/**"
      - "*.md"
    required_extensions: [".md", ".mdx"]
```

### Minimum Change Threshold

Require multiple file changes before triggering expensive operations:

```yaml
areas:
  infrastructure:
    include:
      - "terraform/**"
      - ".github/workflows/**"
    min_changed_files: 2  # Avoid running for single-file typo fixes
```

## Advanced Configuration

### Complete Configuration Example

```yaml
areas:
  backend:
    include:
      - "src/backend/**"
      - "src/api/**"
      - "src/shared/**"
    exclude:
      - "**/*.test.ts"
      - "**/*.spec.ts"
      - "**/fixtures/**"
    required_extensions: [".ts", ".tsx"]
    exclude_binary_files: true
    min_changed_files: 1

  frontend:
    include:
      - "src/frontend/**"
      - "src/components/**"
      - "public/**"
    exclude:
      - "**/*.test.tsx"
      - "**/*.stories.tsx"
    required_extensions: [".tsx", ".ts", ".css", ".scss"]
    ignore_deleted_files: false

  infrastructure:
    include:
      - "terraform/**"
      - ".github/workflows/**"
      - "docker/**"
      - "kubernetes/**"
    min_changed_files: 1

  documentation:
    include:
      - "docs/**"
      - "README.md"
      - "*.md"
    required_extensions: [".md", ".mdx"]
    ignore_deleted_files: false
```

### Workflow with Strict Validation

Enable strict validation to catch configuration issues early:

```yaml
- name: Detect changed areas
  id: changes
  uses: f1rmtea/changed-files@main
  with:
    config: .github/changed-areas.yml
    strict_validation: true
```

### Custom Edge Case Handling

Configure all edge case behaviors:

```yaml
- name: Detect changed areas
  id: changes
  uses: f1rmtea/changed-files@main
  with:
    config: .github/changed-areas.yml
    merge_commit_strategy: all-parents
    force_push_strategy: all-files
    empty_commit_behavior: all
    ignore_binary_files: true
```

## Troubleshooting

### Configuration Not Found

Ensure the configuration file exists at the specified path. Use `config_inline` as a fallback:

```yaml
- uses: f1rmtea/changed-files@main
  with:
    config: .github/changed-areas.yml
    config_inline: |
      areas:
        default:
          include: ["**/*"]
```

### No Areas Triggered

Check the following:
1. Verify that your patterns match the changed file paths
2. Ensure `fetch-depth: 0` is set in your checkout step for accurate diffs
3. Review `min_changed_files` thresholds
4. Check if `exclude` patterns are too broad

### Binary Files Not Excluded

Set `ignore_binary_files: true` globally or `exclude_binary_files: true` per area:

```yaml
- uses: f1rmtea/changed-files@main
  with:
    ignore_binary_files: true
```

## Implementation Guide

### For Pull Request Workflows

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.detect.outputs.backend_changed }}
      frontend: ${{ steps.detect.outputs.frontend_changed }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for accurate diff
      
      - id: detect
        uses: f1rmtea/changed-files@main
        with:
          config: .github/changed-areas.yml
```

### For Push Workflows

```yaml
on:
  push:
    branches:
      - main
      - develop

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.detect.outputs.backend_changed }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - id: detect
        uses: f1rmtea/changed-files@main
```

### Integration with Existing Workflows

Add the detection job at the beginning of your workflow and make other jobs depend on it:

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      backend_changed: ${{ steps.changes.outputs.backend_changed }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - id: changes
        uses: f1rmtea/changed-files@main

  existing-job:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend_changed == 'true'
    runs-on: ubuntu-latest
    steps:
      # Your existing job steps
```

## Best Practices

1. **Use Descriptive Area Names**: Choose names that clearly indicate what part of the codebase they represent
2. **Keep Patterns Simple**: Use broad include patterns and specific exclude patterns for maintainability
3. **Set Fetch Depth**: Always use `fetch-depth: 0` in checkout for accurate diff computation
4. **Test Configuration**: Use `strict_validation: true` during initial setup to catch issues early
5. **Document Areas**: Add comments to your configuration file explaining each area's purpose
6. **Version Control**: Keep the configuration file in version control alongside workflow files
7. **Review Regularly**: Audit area definitions as your codebase structure evolves

## Performance Considerations

- The action is optimized for monorepos with hundreds of files
- Pattern matching uses efficient glob libraries with minimal overhead
- Git operations are delegated to GitHub's API to avoid local cloning
- JSON output generation is lazy-evaluated for workflows that don't need it

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