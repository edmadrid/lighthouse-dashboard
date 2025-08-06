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

# Check if lighthouse CLI is installed
if ! command -v lighthouse &> /dev/null; then
    echo "Error: lighthouse command not found."
    echo "Please install it using: npm install -g lighthouse"
    exit 1
fi

# Check if input file exists
if [ ! -f "../inputs/$INPUT_FILE" ]; then
    echo "Error: Input file ../inputs/$INPUT_FILE not found."
    exit 1
fi

# Extract URLs from JSON and run lighthouse on each
echo "Extracting URLs from $INPUT_FILE..."
URLS=$(node -e "
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
    
    console.log(allUrls.join(' '));
} catch (error) {
    console.error('Error processing $INPUT_FILE:', error);
    process.exit(1);
}
")

# Check if URLs were extracted successfully
if [ -z "$URLS" ]; then
    echo "Error: No URLs found in $INPUT_FILE"
    exit 1
fi

# Create a reports subfolder for this specific run
REPORT_DIR="../../dist/lighthouse-reports/$BASE_NAME-reports"
mkdir -p "$REPORT_DIR"

echo "URLs to test: $URLS"
echo "Running lighthouse on each URL..."

# Counter for success/failure tracking
SUCCESS_COUNT=0
TOTAL_COUNT=0

# Run lighthouse on each URL
for url in $URLS; do
    echo "🔍 Testing ($((TOTAL_COUNT + 1)) of $(echo $URLS | wc -w | tr -d ' ')): $url"
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    
    # Create a safe filename from URL
    FILENAME=$(echo "$url" | sed 's|https\?://||g' | sed 's|[^a-zA-Z0-9.-]|_|g')
    
    echo "   📊 Running Lighthouse accessibility audit..."
    # Run lighthouse with accessibility focus and desktop preset in headless mode
    if lighthouse "$url" \
        --only-categories=accessibility \
        --preset=desktop \
        --output=json \
        --output=html \
        --output-path="$REPORT_DIR/${FILENAME}" \
        --chrome-flags="--headless"; then
        echo "   ✅ Completed: $url"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "   ❌ Failed: $url"
    fi
    echo ""
done

echo "Lighthouse batch completed: $SUCCESS_COUNT/$TOTAL_COUNT URLs processed successfully"

# Check if reports were created
if [ ! "$(ls -A "$REPORT_DIR" 2>/dev/null)" ]; then
    echo "Warning: No reports were generated in $REPORT_DIR directory."
    exit 1
else
    echo "Reports generated successfully in $REPORT_DIR directory:"
    ls -la "$REPORT_DIR"
fi

echo "Lighthouse accessibility audits completed. Reports saved to $REPORT_DIR directory."

# Pass the base name back to the calling script
echo "$BASE_NAME"