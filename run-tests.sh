#!/bin/bash

# Make sure directories exist
mkdir -p src/scripts
mkdir -p src/inputs
mkdir -p dist
mkdir -p dist/lighthouse-reports

# Get input filename from first argument (required)
if [ -z "$1" ]; then
    echo "Error: JSON filename is required."
    echo "Usage: $0 <filename.json>"
    echo "Example: $0 ac.json"
    echo ""
    echo "Available JSON files:"
    ls src/inputs/*.json 2>/dev/null || echo "  No JSON files found in src/inputs/"
    exit 1
fi

INPUT_FILE="$1"

# Check if input file exists
if [ ! -f "src/inputs/$INPUT_FILE" ]; then
    echo "Error: src/inputs/$INPUT_FILE file not found."
    echo "Please create a JSON file at src/inputs/$INPUT_FILE with your URLs organized by category."
    echo ""
    echo "Available JSON files:"
    ls src/inputs/*.json 2>/dev/null || echo "  No JSON files found in src/inputs/"
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

# Generate tabbed index with all dashboards
echo ""
echo "Generating tabbed index dashboard..."
./generate-index.sh

# Clean up unnecessary lighthouse report files
echo ""
echo "Cleaning up lighthouse reports..."
./cleanup-reports.sh

echo ""
echo "🎉 All done! View the complete dashboard at: dist/index.html"