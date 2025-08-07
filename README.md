# Lighthouse Accessibility Dashboard Demo

[![Netlify Status](https://api.netlify.com/api/v1/badges/260580f8-e801-48d5-a6e7-13b46ae89211/deploy-status)](https://app.netlify.com/sites/em-accessibility-dash/deploys)

## Setup

### Install lighthouse

`npm install -g lighthouse`

### Script permissions

```bash
chmod +x run-tests.sh
chmod +x cleanup-reports.sh
chmod +x generate-index.sh
chmod +x src/scripts/lighthouse-cli-script.sh 
chmod +x src/scripts/run-audit.sh
```

## Usage

To test a site, add a JSON file with a list of urls to src/inputs/, then run:

`./run-tests.sh [file1.json file2.json ...]`

Examples:

```bash
# Test all JSON files in src/inputs/
./run-tests.sh

# Test specific sites
./run-tests.sh ac.json dante.json

# Test specific sites (without .json extension)
./run-tests.sh ac dante

# List available sites
./run-tests.sh --list

# Show help
./run-tests.sh --help
```

Each test will:
- Test all pages in the specified JSON file(s)
- Generate individual dashboards (e.g., `dist/ac.html`)
- Update the central dashboard at `dist/index.html`

## Project Structure

- `/src/inputs/` - JSON files which list pages to test for each site
- `/src/scripts/` - Build and processing scripts  
- `/src/assets/` - Static assets (CSS, images) that get copied to `/dist/`
- `/dist/` - Generated HTML dashboards and copied assets

## Local Development

For optional live development with CSS changes:

```bash
npm install        # Install browser-sync locally (optional)
npm run serve      # Start development server with live reload
```

The development server will:
- Serve files from `/dist/` 
- Auto-reload when you edit CSS in `/src/assets/styles.css`
- Watch for changes to HTML and JS files in `/dist/`

## Additional Scripts

- `./cleanup-reports.sh` - Remove old lighthouse report files to save disk space
- `./generate-index.sh` - Manually regenerate the tabbed index and copy assets from existing dashboards