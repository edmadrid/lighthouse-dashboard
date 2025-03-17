#!/bin/bash

# Create a directory for the reports if it doesn't exist
mkdir -p ../../dist/lighthouse-reports

# Check if lighthouse-batch is installed
if ! command -v lighthouse-batch &> /dev/null; then
    echo "Error: lighthouse-batch command not found."
    echo "Please install it using: npm install -g lighthouse-batch"
    exit 1
fi

# Print the sites.txt file content for debugging
echo "URLs to test:"
cat ../inputs/sites.txt

# Run lighthouse-batch with verbose output
echo "Running lighthouse-batch..."
lighthouse-batch -f ../inputs/sites.txt -o ../../dist/lighthouse-reports --html --params "--only-categories=accessibility --preset=desktop" --verbose

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

echo "Lighthouse accessibility audits completed. Reports saved to dist/lighthouse-reports directory."