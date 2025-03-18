#!/bin/bash

# Make sure directories exist
mkdir -p src/scripts
mkdir -p src/inputs
mkdir -p dist

# Check if input file exists
if [ ! -f "src/inputs/sites.json" ]; then
    echo "Error: src/inputs/sites.json file not found."
    echo "Please create a JSON file at src/inputs/sites.json with your URLs organized by category."
    exit 1
fi

# Run the accessibility tests
cd src/scripts
./run-audit.sh
cd ../..

echo "Accessibility testing complete!"
echo "Results are available at:"
echo "- Individual reports: dist/lighthouse-reports/"
echo "- Summary dashboard: dist/accessibility-summary.html"