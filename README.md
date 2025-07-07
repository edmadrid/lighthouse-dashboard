# cul lighthouse dashboard test

[![Netlify Status](https://api.netlify.com/api/v1/badges/260580f8-e801-48d5-a6e7-13b46ae89211/deploy-status)](https://app.netlify.com/sites/em-accessibility-dash/deploys)

## Install lighthouse-batch

`npm install -g lighthouse-batch`

## Script permissions

```
chmod +x run-tests.sh
chmod +x src/scripts/lighthouse-batch-script.sh 
chmod +x src/scripts/run-audit.sh
```

## Usage

`./run-tests.sh <filename.json>` will test all sites specified in the JSON file and generate individual dashboards plus a tabbed index.

Example: `./run-tests.sh ac.json` will:
- Test all sites in `/src/inputs/ac.json` 
- Generate a dashboard at `/dist/ac.html`
- Automatically update the tabbed index at `/dist/index.html`

**Required:** You must specify a JSON filename. The script will show available JSON files if none is provided. 