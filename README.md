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

`./run-tests.sh <filename.json>` will test all pages specified in the JSON file and generate individual dashboards plus a tabbed index.

Example: `./run-tests.sh ac.json` will:
- Test all pages in `/src/inputs/ac.json` 
- Generate a dashboard at `/dist/ac.html`
- Update the tabbed index at `/dist/index.html`

## Project Structure

- `/src/inputs/` - JSON files which list pages to test for each site
- `/src/scripts/` - Build and processing scripts  
- `/dist/` - Generated HTML dashboards and CSS
- `/dist/styles.css` - Shared stylesheet for all dashboards

## Additional Scripts

- `./cleanup-reports.sh` - Remove old lighthouse report files to save disk space
- `./generate-index.sh` - Manually regenerate the tabbed index from existing dashboards