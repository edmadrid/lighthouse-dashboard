#!/bin/bash

# Make sure directories exist
mkdir -p src/scripts
mkdir -p src/inputs
mkdir -p dist
mkdir -p dist/lighthouse-reports

# Get input filename from first argument or use sites.json as default
INPUT_FILE="${1:-sites.json}"

# Check if input file exists
if [ ! -f "src/inputs/$INPUT_FILE" ]; then
    echo "Error: src/inputs/$INPUT_FILE file not found."
    echo "Please create a JSON file at src/inputs/$INPUT_FILE with your URLs organized by category."
    exit 1
fi

# Extract base name without extension
BASE_NAME=$(basename "$INPUT_FILE" .json)

# Run the accessibility tests
cd src/scripts
./run-audit.sh "$INPUT_FILE"
cd ../..

echo "Accessibility testing complete!"
echo "Results are available at:"
echo "- Individual reports: dist/lighthouse-reports/${BASE_NAME}-reports/"
echo "- Summary dashboard: dist/${BASE_NAME}.html"