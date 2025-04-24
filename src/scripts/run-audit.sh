#!/bin/bash

# Get input filename from first argument
INPUT_FILE="$1"
if [ -z "$INPUT_FILE" ]; then
    echo "Error: No input file specified."
    echo "Usage: $0 <input-json-file>"
    exit 1
fi

echo "Starting Lighthouse Accessibility Audit for $INPUT_FILE..."

# Run the lighthouse-batch with the input file
BASE_NAME=$(./lighthouse-batch-script.sh "$INPUT_FILE")

# Check if the batch script was successful
if [ $? -ne 0 ]; then
    echo "Error: Lighthouse batch script failed."
    exit 1
fi

# Run the summary generator with the input file
echo "Generating summary report for $INPUT_FILE..."
node generate-summary.js "$INPUT_FILE"

# Check if the summary generator was successful
if [ $? -ne 0 ]; then
    echo "Error: Summary generator script failed."
    exit 1
fi

echo "Audit complete! Open dist/${BASE_NAME}.html in your browser to view the results."