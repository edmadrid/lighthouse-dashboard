#!/bin/bash

# Script to run accessibility tests on JSON files
# Usage: 
#   ./run-tests.sh                    # Run all JSON files
#   ./run-tests.sh ac.json dante.json # Run specific files
#   ./run-tests.sh --list             # List available JSON files

show_usage() {
    echo "Usage: $0 [OPTIONS] [file1.json file2.json ...]"
    echo ""
    echo "OPTIONS:"
    echo "  --list, -l    List all available JSON files"
    echo "  --help, -h    Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0                        # Test all JSON files"
    echo "  $0 ac.json dante.json     # Test specific files"
    echo "  $0 --list                 # Show available files"
    echo ""
}

list_files() {
    echo "Available JSON files in src/inputs/:"
    if [ -d "src/inputs" ]; then
        for file in src/inputs/*.json; do
            if [ -f "$file" ]; then
                basename "$file"
            fi
        done | sort
    else
        echo "  src/inputs directory not found"
    fi
}

# Parse arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_usage
    exit 0
fi

if [ "$1" = "--list" ] || [ "$1" = "-l" ]; then
    list_files
    exit 0
fi

# Check if inputs directory exists
if [ ! -d "src/inputs" ]; then
    echo "Error: src/inputs directory not found."
    exit 1
fi

# Determine which files to process
FILES_TO_TEST=()

if [ $# -eq 0 ]; then
    # No arguments - test all files
    echo "🚀 No files specified - testing all JSON files in src/inputs/"
    for json_file in src/inputs/*.json; do
        if [ -f "$json_file" ]; then
            FILES_TO_TEST+=($(basename "$json_file"))
        fi
    done
else
    # Specific files provided
    echo "🚀 Testing specified files: $*"
    for file in "$@"; do
        if [[ "$file" != *.json ]]; then
            file="$file.json"  # Add .json extension if missing
        fi
        
        if [ -f "src/inputs/$file" ]; then
            FILES_TO_TEST+=("$file")
        else
            echo "Warning: src/inputs/$file not found - skipping"
        fi
    done
fi

# Check if we have files to test
if [ ${#FILES_TO_TEST[@]} -eq 0 ]; then
    echo "No valid JSON files to test."
    echo ""
    list_files
    exit 1
fi

echo "=================================================="
echo "Files to test: ${#FILES_TO_TEST[@]}"
for file in "${FILES_TO_TEST[@]}"; do
    echo "  - $file"
done
echo ""

# Initialize counters
SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_FILES=()

# Process each file
for filename in "${FILES_TO_TEST[@]}"; do
    echo "🔄 Processing: $filename"
    echo "----------------------------------------"
    
    # Extract base name without extension
    BASE_NAME=$(basename "$filename" .json)
    
    # Run the accessibility tests
    if (cd src/scripts && ./run-audit.sh "$filename"); then
        echo "Accessibility testing complete for $filename!"
        echo "Results are available at:"
        echo "- Individual reports: dist/lighthouse-reports/${BASE_NAME}-reports/"
        echo "- Summary dashboard: dist/${BASE_NAME}.html"
        echo "✅ $filename completed successfully"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "❌ $filename failed"
        FAILED_FILES+=("$filename")
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    echo ""
done

# Generate tabbed index with all dashboards
if [ "$SUCCESS_COUNT" -gt 0 ]; then
    echo ""
    echo "Generating tabbed index dashboard..."
    ./generate-index.sh
    
    # Clean up unnecessary lighthouse report files
    echo ""
    echo "Cleaning up lighthouse reports..."
    ./cleanup-reports.sh
fi

# Summary
echo "=================================================="
echo "📊 BATCH TEST SUMMARY"
echo "=================================================="
echo "Total files processed: ${#FILES_TO_TEST[@]}"
echo "✅ Successful: $SUCCESS_COUNT"
echo "❌ Failed: $FAIL_COUNT"

if [ ${#FAILED_FILES[@]} -gt 0 ]; then
    echo ""
    echo "Failed files:"
    for file in "${FAILED_FILES[@]}"; do
        echo "  - $file"
    done
fi

echo ""
if [ "$FAIL_COUNT" -eq 0 ]; then
    echo "🎉 All tests completed successfully!"
    echo "📂 View the complete dashboard at: dist/index.html"
    exit 0
else
    echo "⚠️  Some tests failed. Check the output above for details."
    exit 1
fi