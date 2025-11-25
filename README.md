# Changed Areas Action

A production-ready GitHub Action for detecting changed files and classifying them into areas for efficient CI/CD in monorepos.

## Features

- ✅ **Clear include/exclude semantics** - No confusing negation patterns
- ✅ **File extension filtering** - Match only specific file types
- ✅ **Edge case handling** - Handles first commits, force pushes, empty commits
- ✅ **Binary file detection** - Optionally ignore binary files
- ✅ **Config file support** - Keep workflow files clean
- ✅ **Validation** - Catch configuration errors early
- ✅ **Comprehensive outputs** - Per-area flags, file lists, and JSON summary

## Quick Start

### 1. Create configuration file

Create `.github/changed-areas.yml`:
```yaml
areas:
  backend:
    include:
      - "src/backend/**"
    exclude:
      - "**/*.test.ts"
    required_extensions: [".ts", ".tsx"]

  frontend:
    include:
      - "src/frontend/**"
    exclude:
      - "**/*.test.tsx"
```

### 2. Use in workflow
```yaml
name: CI

on: [push, pull_request]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      backend_changed: ${{ steps.changes.outputs.backend_changed }}
      frontend_changed: ${{ steps.changes.outputs.frontend_changed }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Detect changed areas
        id: changes
        uses: your-org/changed-areas-action@v1

  test-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend_changed == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: npm test -- backend

  test-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend_changed == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: npm test -- frontend
```

## Configuration Reference

### Area Configuration

Each area supports the following options:
```yaml
areas:
  area-name:
    # Required: Patterns to include
    include:
      - "src/backend/**"
      - "src/api/**"
    
    # Optional: Patterns to exclude
    exclude:
      - "**/*.test.ts"
      - "**/fixtures/**"
    
    # Optional: Only match files with these extensions
    required_extensions: [".ts", ".tsx"]
    
    # Optional: Minimum number of changed files to trigger
    min_changed_files: 1
    
    # Optional: Ignore binary files in this area
    exclude_binary_files: true
    
    # Optional: Ignore deleted files
    ignore_deleted_files: false
    
    # Optional: Ignore renamed files
    ignore_renamed_files: false
```

### Action Inputs
```yaml
- uses: your-org/changed-areas-action@v1
  with:
    # Path to config file (default: .github/changed-areas.yml)
    config: .github/changed-areas.yml
    
    # Inline YAML config (takes precedence over file)
    config_inline: |
      areas:
        backend:
          include: ["src/**"]
    
    # GitHub token (default: ${{ github.token }})
    github_token: ${{ secrets.GITHUB_TOKEN }}
    
    # Merge commit strategy: first-parent | all-parents
    merge_commit_strategy: first-parent
    
    # Force push strategy: compare-default-branch | all-files | fail
    force_push_strategy: compare-default-branch
    
    # Empty commit behavior: none | all
    empty_commit_behavior: none
    
    # Globally ignore binary files
    ignore_binary_files: false
    
    # Treat warnings as errors
    strict_validation: false
```

### Outputs

**Per-area outputs:**
- `{area_name}_changed`: "true" or "false"
- `{area_name}_files`: Newline-separated list of changed files
- `{area_name}_count`: Number of changed files

**JSON summary:**
- `areas_json`: Complete JSON object with all results

Example:
```json
{
  "backend": {
    "changed": true,
    "files": ["src/api.ts", "src/db.ts"],
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

A file belongs to an area if:
1. It matches **ANY** include pattern
2. AND it matches **NO** exclude patterns
3. AND (if specified) its extension is in required_extensions
4. AND (if configured) it's not a binary file
5. AND (if configured) it's not deleted/renamed

This is simple, predictable, and easy to debug.

## Edge Cases

### First Commit
When pushing the first commit to a repository, all files are marked as changed.

### Force Push
By default, compares against the default branch. Configure with `force_push_strategy`.

### Empty Commits
By default, no areas are triggered. Configure with `empty_commit_behavior`.

### Merge Commits
Uses first-parent strategy by default. Configure with `merge_commit_strategy`.

## Examples

See the `examples/` directory for:
- Basic workflow
- Monorepo with matrix strategy
- Sample configurations

## Migration

### From `dorny/paths-filter`

Replace:
```yaml
- uses: dorny/paths-filter@v2
  with:
    filters: |
      backend:
        - 'src/backend/**'
        - '!src/backend/experimental/**'
```

With:
```yaml
- uses: your-org/changed-areas-action@v1
  with:
    config_inline: |
      areas:
        backend:
          include:
            - "src/backend/**"
          exclude:
            - "src/backend/experimental/**"
```

### From `tj-actions/changed-files`

Replace:
```yaml
- uses: tj-actions/changed-files@v40
  with:
    files: |
      src/backend/**
```

With:
```yaml
- uses: your-org/changed-areas-action@v1
  with:
    config_inline: |
      areas:
        backend:
          include:
            - "src/backend/**"
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue first to discuss changes.