# Local Font Implementation Guide

## Overview
This document describes the process of implementing a privacy-focused, local-only font loading strategy for the Language Learning Portal. The implementation ensures no external font services are used, improving privacy, performance, and offline capabilities.

## Prerequisites
- Ubuntu/Debian-based system (for manual setup)
- `curl` for downloading fonts
- `woff2` tools for font conversion (if needed)

### Installing Required Tools
```bash
# Install woff2 tools (required for font conversion if needed)
sudo apt-get update
sudo apt-get install woff2
```

## Implementation Components

### 1. Directory Structure
```
frontend/
├── public/
│   └── fonts/
│       ├── inter/
│       │   ├── Inter-Regular.woff2
│       │   ├── Inter-Medium.woff2
│       │   └── Inter-Bold.woff2
│       └── roboto/
│           ├── Roboto-Regular.woff2
│           ├── Roboto-Medium.woff2
│           └── Roboto-Bold.woff2
└── src/
    └── styles/
        ├── fonts.css
        └── index.css
```

### 2. Font Download Script
Location: `frontend/scripts/download-fonts.sh`

```bash
#!/bin/bash

# Directory setup
FONT_DIR="public/fonts"
INTER_DIR="$FONT_DIR/inter"
ROBOTO_DIR="$FONT_DIR/roboto"

# Create directories if they don't exist
mkdir -p "$INTER_DIR"
mkdir -p "$ROBOTO_DIR"

# Download Inter fonts
echo "Downloading Inter fonts..."
curl -L -o "$INTER_DIR/Inter-Regular.woff2" "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.woff2"
curl -L -o "$INTER_DIR/Inter-Medium.woff2" "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.woff2"
curl -L -o "$INTER_DIR/Inter-Bold.woff2" "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.woff2"

# Download Roboto fonts
echo "Downloading Roboto fonts..."
curl -L -o "$ROBOTO_DIR/Roboto-Regular.woff2" "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.woff2"
curl -L -o "$ROBOTO_DIR/Roboto-Medium.woff2" "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9vBQ.woff2"
curl -L -o "$ROBOTO_DIR/Roboto-Bold.woff2" "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvBQ.woff2"

echo "Font download complete!"
```

### 3. CSS Implementation
Location: `frontend/src/styles/fonts.css`

```css
/* Inter Font Family */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* Additional weights... */

/* Font Variables */
:root {
  --font-primary: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  --font-secondary: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
```

## Manual Setup Process

1. Install required tools:
   ```bash
   sudo apt-get update
   sudo apt-get install woff2
   ```

2. Make the download script executable:
   ```bash
   chmod +x frontend/scripts/download-fonts.sh
   ```

3. Run the download script:
   ```bash
   cd frontend
   ./scripts/download-fonts.sh
   ```

4. Verify font files:
   ```bash
   ls -l public/fonts/{inter,roboto}
   ```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Setup Local Fonts
on:
  push:
    paths:
      - 'frontend/**'
  workflow_dispatch:

jobs:
  setup-fonts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y woff2 curl
      
      - name: Download Fonts
        run: |
          cd frontend
          chmod +x scripts/download-fonts.sh
          ./scripts/download-fonts.sh
      
      - name: Verify Font Files
        run: |
          ls -l frontend/public/fonts/{inter,roboto}
          
      - name: Cache Fonts
        uses: actions/cache@v3
        with:
          path: frontend/public/fonts
          key: ${{ runner.os }}-fonts-${{ hashFiles('frontend/scripts/download-fonts.sh') }}
```

### GitLab CI Example
```yaml
setup-fonts:
  image: ubuntu:latest
  script:
    - apt-get update
    - apt-get install -y woff2 curl
    - cd frontend
    - chmod +x scripts/download-fonts.sh
    - ./scripts/download-fonts.sh
  cache:
    key: ${CI_COMMIT_REF_SLUG}-fonts
    paths:
      - frontend/public/fonts/
  artifacts:
    paths:
      - frontend/public/fonts/
```

## Performance Considerations

1. Font Loading Strategy
   - Uses `font-display: swap` for optimal loading behavior
   - Implements system font fallbacks
   - Preloads critical fonts

2. Caching
   - Font files are cached by the browser
   - CI/CD caches fonts between builds
   - Service worker caches fonts for offline use

## Troubleshooting

### Common Issues

1. Font Download Failures
   ```bash
   # Verify network connectivity
   curl -I https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.woff2
   
   # Check directory permissions
   ls -la frontend/public/fonts/
   ```

2. Font Not Loading
   - Check file paths in CSS
   - Verify font files exist
   - Check browser console for 404 errors

### Verification Steps

1. Check Font Files:
   ```bash
   find frontend/public/fonts -type f -name "*.woff2"
   ```

2. Validate CSS:
   ```bash
   # Check if font-face declarations are present
   grep -r "@font-face" frontend/src/styles/
   ```

## Security and Privacy Benefits

1. No External Dependencies
   - All fonts served locally
   - No tracking via font services
   - Works offline

2. Performance
   - Reduced network requests
   - Controlled caching
   - Faster initial page load

## Maintenance

### Adding New Fonts

1. Update `download-fonts.sh`:
   ```bash
   # Add new font download commands
   NEW_FONT_DIR="$FONT_DIR/newfont"
   mkdir -p "$NEW_FONT_DIR"
   curl -L -o "$NEW_FONT_DIR/NewFont-Regular.woff2" "URL_TO_FONT"
   ```

2. Update `fonts.css`:
   ```css
   @font-face {
     font-family: 'NewFont';
     src: url('/fonts/newfont/NewFont-Regular.woff2') format('woff2');
     font-weight: 400;
     font-style: normal;
     font-display: swap;
   }
   ```

### Updating Existing Fonts

1. Check for updates:
   ```bash
   # Add version check to download script
   curl -I "FONT_URL" | grep "Last-Modified"
   ```

2. Update version numbers in download URLs if needed

## Version Control

- Font files should be ignored in `.gitignore`
- CI/CD process handles font downloads
- Cache keys should be updated when font versions change

## Future Improvements

1. Automated Version Checking
   - Script to check for font updates
   - Automated PR creation for updates

2. Font Subsetting
   - Implement font subsetting for smaller files
   - Create language-specific subsets

3. Performance Monitoring
   - Track font loading metrics
   - Monitor cache hit rates 