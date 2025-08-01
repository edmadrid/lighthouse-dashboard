#!/bin/bash

# Get input filename from argument
INPUT_FILE="$1"
if [ -z "$INPUT_FILE" ]; then
    echo "Error: No input file specified."
    echo "Usage: $0 <input-json-file>"
    exit 1
fi

# Extract base name without extension
BASE_NAME=$(basename "$INPUT_FILE" .json)

# Create a directory for the reports if it doesn't exist
mkdir -p ../../dist/lighthouse-reports

# Check if lighthouse-batch is installed
if ! command -v lighthouse-batch &> /dev/null; then
    echo "Error: lighthouse-batch command not found."
    echo "Please install it using: npm install -g lighthouse-batch"
    exit 1
fi

# Check if input file exists
if [ ! -f "../inputs/$INPUT_FILE" ]; then
    echo "Error: Input file ../inputs/$INPUT_FILE not found."
    exit 1
fi

# Generate a temporary URLs file from the JSON
echo "Extracting URLs from $INPUT_FILE..."
node -e "
const fs = require('fs');
const path = require('path');
const jsonPath = path.join(__dirname, '../inputs/$INPUT_FILE');

try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const allUrls = [];
    
    // Flatten all URLs from all categories
    for (const category in data) {
        if (Array.isArray(data[category])) {
            data[category].forEach(item => {
                // Handle both string URLs and object URLs with titles
                if (typeof item === 'string') {
                    allUrls.push(item);
                } else if (typeof item === 'object' && item.url) {
                    allUrls.push(item.url);
                }
            });
        }
    }
    
    // Write to temp file
    const tempPath = path.join(__dirname, '../inputs/temp-urls.txt');
    fs.writeFileSync(tempPath, allUrls.join('\n'));
    console.log(\`Extracted \${allUrls.length} URLs to temporary file\`);
} catch (error) {
    console.error('Error processing $INPUT_FILE:', error);
    process.exit(1);
}
"

# Check if the temporary file was created successfully
if [ ! -f "../inputs/temp-urls.txt" ]; then
    echo "Error: Failed to create temporary URLs file from $INPUT_FILE"
    exit 1
fi

# Print the extracted URLs for debugging
echo "URLs to test:"
cat ../inputs/temp-urls.txt

# Create a reports subfolder for this specific run
REPORT_DIR="../../dist/lighthouse-reports/$BASE_NAME-reports"
mkdir -p "$REPORT_DIR"

# Run lighthouse-batch with verbose output
echo "Running lighthouse-batch..."
lighthouse-batch -g -f ../inputs/temp-urls.txt -o "$REPORT_DIR" --html --params "--only-categories=accessibility --preset=desktop" --verbose

# Check if the command succeeded
if [ $? -ne 0 ]; then
    echo "Error: lighthouse-batch command failed."
    exit 1
fi

# Check if reports were created
if [ ! "$(ls -A "$REPORT_DIR" 2>/dev/null)" ]; then
    echo "Warning: No reports were generated in $REPORT_DIR directory."
else
    echo "Reports generated successfully in $REPORT_DIR directory:"
    ls -la "$REPORT_DIR"
fi

# Clean up temporary file
rm -f ../inputs/temp-urls.txt
echo "Temporary URL list removed."

echo "Lighthouse accessibility audits completed. Reports saved to $REPORT_DIR directory."

# Pass the base name back to the calling script
echo "$BASE_NAME"