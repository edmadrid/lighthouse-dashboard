#!/bin/bash

# Cleanup script to remove unnecessary lighthouse report files after dashboard generation
# This keeps only the summary.json files needed for potential future processing

echo "🧹 Cleaning up lighthouse reports..."

REPORTS_DIR="dist/lighthouse-reports"

if [ ! -d "$REPORTS_DIR" ]; then
    echo "No lighthouse-reports directory found. Nothing to clean."
    exit 0
fi

# Count files before cleanup
BEFORE_COUNT=$(find "$REPORTS_DIR" -type f | wc -l)
BEFORE_SIZE=$(du -sh "$REPORTS_DIR" | cut -f1)

echo "Before cleanup: $BEFORE_COUNT files, $BEFORE_SIZE total"

# Remove individual HTML and JSON report files, but keep summary.json files
find "$REPORTS_DIR" -type f \( -name "*.report.html" -o -name "*.report.json" \) -delete

# Remove empty directories
find "$REPORTS_DIR" -type d -empty -delete

# Count files after cleanup
AFTER_COUNT=$(find "$REPORTS_DIR" -type f | wc -l)
AFTER_SIZE=$(du -sh "$REPORTS_DIR" 2>/dev/null | cut -f1 || echo "0B")

echo "After cleanup: $AFTER_COUNT files, $AFTER_SIZE total"
echo "✅ Cleanup complete!"

# Show what's left
echo ""
echo "Remaining files:"
find "$REPORTS_DIR" -type f -name "*.json" | sort