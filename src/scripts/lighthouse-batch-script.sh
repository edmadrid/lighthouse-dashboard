#!/bin/bash

# Create a directory for the reports if it doesn't exist
mkdir -p ../../dist/lighthouse-reports

# Check if lighthouse-batch is installed
if ! command -v lighthouse-batch &> /dev/null; then
    echo "Error: lighthouse-batch command not found."
    echo "Please install it using: npm install -g lighthouse-batch"
    exit 1
fi

# Generate a temporary URLs file from the JSON
echo "Extracting URLs from sites.json..."
node -e '
const fs = require("fs");
const path = require("path");
const jsonPath = path.join(__dirname, "../inputs/sites.json");

try {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const allUrls = [];
    
    // Flatten all URLs from all categories
    for (const category in data) {
        if (Array.isArray(data[category])) {
            allUrls.push(...data[category]);
        }
    }
    
    // Write to temp file
    const tempPath = path.join(__dirname, "../inputs/temp-sites.txt");
    fs.writeFileSync(tempPath, allUrls.join("\n"));
    console.log(`Extracted ${allUrls.length} URLs to temporary file`);
} catch (error) {
    console.error("Error processing sites.json:", error);
    process.exit(1);
}
'

# Check if the temporary file was created successfully
if [ ! -f "../inputs/temp-sites.txt" ]; then
    echo "Error: Failed to create temporary URLs file from sites.json"
    exit 1
fi

# Print the extracted URLs for debugging
echo "URLs to test:"
cat ../inputs/temp-sites.txt

# Run lighthouse-batch with verbose output
echo "Running lighthouse-batch..."
lighthouse-batch -g -f ../inputs/temp-sites.txt -o ../../dist/lighthouse-reports --html --params "--only-categories=accessibility --preset=desktop" --verbose

# Check if the command succeeded
if [ $? -ne 0 ]; then
    echo "Error: lighthouse-batch command failed."
    exit 1
fi

# Check if reports were created
if [ ! "$(ls -A ../../dist/lighthouse-reports 2>/dev/null)" ]; then
    echo "Warning: No reports were generated in the lighthouse-reports directory."
else
    echo "Reports generated successfully in lighthouse-reports directory:"
    ls -la ../../dist/lighthouse-reports
fi

# Clean up temporary file
rm -f ../inputs/temp-sites.txt
echo "Temporary URL list removed."

echo "Lighthouse accessibility audits completed. Reports saved to dist/lighthouse-reports directory."