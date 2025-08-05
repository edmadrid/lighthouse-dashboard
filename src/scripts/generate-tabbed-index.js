#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '../../dist');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');

function extractBodyContent(htmlContent) {
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return '';
  
  return bodyMatch[1];
}

function extractTitle(htmlContent) {
  const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
  if (!titleMatch) return '';
  
  return titleMatch[1].replace('CUL Accessibility Dashboard - ', '');
}

function extractTitleFromJson(filename) {
  try {
    const jsonPath = path.join(__dirname, '../../src/inputs', filename + '.json');
    if (fs.existsSync(jsonPath)) {
      const jsonContent = fs.readFileSync(jsonPath, 'utf8');
      const data = JSON.parse(jsonContent);
      const keys = Object.keys(data);
      if (keys.length > 0) {
        return keys[0]; // Return the first key as the title
      }
    }
  } catch (error) {
    console.log(`Could not extract title from ${filename}.json, using filename instead`);
  }
  return null;
}

function extractGeneratedDate(htmlContent) {
  const footerMatch = htmlContent.match(/<footer>Generated on ([^<]*)<\/footer>/i);
  if (footerMatch) {
    return footerMatch[1];
  }
  return new Date().toLocaleString();
}

function extractStyles(htmlContent) {
  const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (!styleMatch) return '';
  
  return styleMatch[1];
}

function extractScripts(htmlContent) {
  const scriptMatch = htmlContent.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  if (!scriptMatch) return '';
  
  return scriptMatch[1];
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateTabbedIndex() {
  try {
    // Read all HTML files in dist directory
    const files = fs.readdirSync(DIST_DIR)
      .filter(file => file.endsWith('.html') && file !== 'index.html')
      .sort();

    if (files.length === 0) {
      console.log('No dashboard files found in /dist directory');
      return;
    }

    console.log(`Found ${files.length} dashboard files: ${files.join(', ')}`);

    // Extract content from each file
    const tabs = [];
    let dashboardScript = '';

    files.forEach(filename => {
      const filePath = path.join(DIST_DIR, filename);
      const htmlContent = fs.readFileSync(filePath, 'utf8');
      
      const baseFilename = filename.replace('.html', '');
      const jsonTitle = extractTitleFromJson(baseFilename);
      const htmlTitle = extractTitle(htmlContent) || baseFilename;
      
      // Use JSON title if available, otherwise use HTML title
      const title = jsonTitle || capitalizeFirst(htmlTitle);
      
      const bodyContent = extractBodyContent(htmlContent);
      const scripts = extractScripts(htmlContent);
      const generatedDate = extractGeneratedDate(htmlContent);
      
      if (scripts && !dashboardScript) {
        // Only take the script from the first dashboard to avoid duplicates
        dashboardScript = scripts;
      }
      
      // Replace the h1 title and add permalink/date with flexbox layout
      let updatedContent = bodyContent.replace(
        /<h1>CUL Accessibility Dashboard - [^<]*<\/h1>/,
        `<div class="tab-header"><h2>${title}</h2><span class="tab-meta"><a href="${filename}" target="_blank">Permalink</a> | Generated on ${generatedDate}</span></div>`
      );
      
      // Also replace the new banner format if present
      updatedContent = updatedContent.replace(
        /<div class="main-header">\s*<h1><a href="\/">CUL Accessibility Dashboard<\/a>: <strong>[^<]*<\/strong><\/h1>\s*<\/div>/,
        `<div class="tab-header"><h2>${title}</h2><span class="tab-meta"><a href="${filename}" target="_blank">Permalink</a> | Generated on ${generatedDate}</span></div>`
      );
      
      // Also replace the existing tab-header format if present
      updatedContent = updatedContent.replace(
        /<div class="tab-header">\s*<h1><a href="\/">CUL Accessibility Dashboard<\/a>: <strong>[^<]*<\/strong><\/h1>\s*<span class="tab-meta">Generated on [^<]*<\/span>\s*<\/div>/,
        `<div class="tab-header"><h2>${title}</h2><span class="tab-meta"><a href="${filename}" target="_blank">Permalink</a> | Generated on ${generatedDate}</span></div>`
      );
      
      // Remove the toggle buttons for showing/hiding URLs
      updatedContent = updatedContent.replace(
        /<button[^>]*class="[^"]*toggle-urls[^"]*"[^>]*onclick="toggleUrlVisibility\([^)]*\)"[^>]*>Show URLs<\/button>/g,
        ''
      );
      
      // Remove the "Show All URLs" and "Hide All URLs" buttons
      updatedContent = updatedContent.replace(
        /<button[^>]*onclick="toggleAllUrls\(true\)"[^>]*>Show All URLs<\/button>/g,
        ''
      );
      updatedContent = updatedContent.replace(
        /<button[^>]*onclick="toggleAllUrls\(false\)"[^>]*>Hide All URLs<\/button>/g,
        ''
      );
      
      tabs.push({
        id: baseFilename,
        title: title,
        content: updatedContent,
        generatedDate: generatedDate,
        filename: filename
      });
    });

    // Generate the tabbed HTML
    const tabbedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>CUL Accessibility Dashboard</title>
  <link rel="stylesheet" href="styles.css">
  <script>
    ${dashboardScript}
    
    function switchTab(tabId) {
      // Hide all tab contents
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Remove active class from all tab buttons
      document.querySelectorAll('.tab-nav button').forEach(button => {
        button.classList.remove('active');
      });
      
      // Hide welcome message when a tab is selected
      const welcomeMessage = document.querySelector('.welcome-message');
      if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
      }
      
      // Show selected tab content
      const targetContent = document.getElementById('tab-' + tabId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
      
      // Add active class to clicked button
      const targetButton = document.getElementById('btn-' + tabId);
      if (targetButton) {
        targetButton.classList.add('active');
      }
    }
    
    // Ensure all tab-specific JavaScript functions work in the tabbed context
    window.addEventListener('DOMContentLoaded', function() {
      // Show all URL tables by default in tabbed interface
      document.querySelectorAll('.tab-content .url-table').forEach(table => {
        table.style.display = 'table';
      });
    });
  </script>
</head>
<body>
  <div class="main-header">
    <h1><a href="/">CUL Accessibility Dashboard</a></h1>
  </div>
  
  <div class="tab-container">
    <ul class="tab-nav">
      ${tabs.map(tab => `<li><button id="btn-${tab.id}" onclick="switchTab('${tab.id}')">${tab.title}</button></li>`).join('')}
    </ul>

    <div class="welcome-message">
      <p>Select a tab above to view accessibility test results</p>
    </div>
    
    ${tabs.map(tab => `
    <div id="tab-${tab.id}" class="tab-content">
      ${tab.content}
    </div>
    `).join('')}
  </div>
</body>
</html>`;

    // Write the generated HTML to index.html
    fs.writeFileSync(INDEX_FILE, tabbedHTML);
    
    console.log(`Generated tabbed index.html with ${tabs.length} tabs: ${tabs.map(t => t.title).join(', ')}`);
    console.log(`File saved to: ${INDEX_FILE}`);
    
  } catch (error) {
    console.error('Error generating tabbed index:', error);
    process.exit(1);
  }
}

// Run the script
generateTabbedIndex();