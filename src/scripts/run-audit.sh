#!/bin/bash

echo "Starting Lighthouse Accessibility Audit..."

# Run the lighthouse-batch
./lighthouse-batch-script.sh

# Check if the batch script was successful
if [ $? -ne 0 ]; then
    echo "Error: Lighthouse batch script failed."
    exit 1
fi

# Run the summary generator
echo "Generating summary report..."
node generate-summary.js

# Check if the summary generator was successful
if [ $? -ne 0 ]; then
    echo "Error: Summary generator script failed."
    exit 1
fi

echo "Audit complete! Open dist/accessibility-summary.html in your browser to view the results."