#!/bin/bash

# Generate tabbed index.html from existing dashboard files
echo "Generating tabbed index.html..."
node src/scripts/generate-tabbed-index.js

if [ $? -eq 0 ]; then
    echo "✅ Tabbed index.html generated successfully!"
    echo "📂 View at: dist/index.html"
else
    echo "❌ Error generating tabbed index.html"
    exit 1
fi