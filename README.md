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

`./run-tests.sh` will test all sites specifed in /inputs/sites.json and generate a dashboard in /dist/sites.html. 

You can test a different set of sites by adding a json file to /inputs and specifying the file name when running the script, e.g., `./run-tests.sh file-name.json`. This will output a new dashboard at /dist/file-name.json. 