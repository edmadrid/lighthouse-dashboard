# Lighthouse Accessibility Dashboard Demo

[![Netlify Status](https://api.netlify.com/api/v1/badges/260580f8-e801-48d5-a6e7-13b46ae89211/deploy-status)](https://app.netlify.com/sites/em-accessibility-dash/deploys)

## Setup

### Install lighthouse-batch

`npm install -g lighthouse-batch`

### Script permissions

```bash
chmod +x run-tests.sh
chmod +x cleanup-reports.sh
chmod +x generate-index.sh
chmod +x src/scripts/lighthouse-batch-script.sh 
chmod +x src/scripts/run-audit.sh
```

## Usage

`./run-tests.sh [file1.json file2.json ...]` provides flexible testing of JSON files:

```bash
# Test all JSON files in src/inputs/
./run-tests.sh

# Test specific files
./run-tests.sh ac.json dante.json

# Test specific files (without .json extension)
./run-tests.sh ac dante

# List available files
./run-tests.sh --list

# Show help
./run-tests.sh --help
```

**Examples:**
- `./run-tests.sh ac.json` - Test only the AC site
- `./run-tests.sh` - Test all sites in src/inputs/
- `./run-tests.sh ac dante dlc` - Test specific sites

Each run will:
- Test all pages in the specified JSON file(s)
- Generate individual dashboards (e.g., `dist/ac.html`)
- Update the tabbed index at `dist/index.html`
- Provide a summary of successes/failures

## Project Structure

- `/src/inputs/` - JSON files which list pages to test for each site
- `/src/scripts/` - Build and processing scripts  
- `/dist/` - Generated HTML dashboards and CSS
- `/dist/styles.css` - Shared stylesheet for all dashboards

## Additional Scripts

- `./cleanup-reports.sh` - Remove old lighthouse report files to save disk space
- `./generate-index.sh` - Manually regenerate the tabbed index from existing dashboards