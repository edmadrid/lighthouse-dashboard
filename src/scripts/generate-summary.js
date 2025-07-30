const fs = require('fs');
const path = require('path');

// Get input filename from command line arguments
const inputFileName = process.argv[2];
if (!inputFileName) {
  console.error('Error: No input file specified');
  console.error('Usage: node generate-summary.js <input-json-file>');
  process.exit(1);
}

// Extract base name without extension
const baseName = path.basename(inputFileName, '.json');

// Define the reports directory path for this specific run
const reportsDir = path.join(__dirname, `../../dist/lighthouse-reports/${baseName}-reports`);

// Check if reports directory exists
if (!fs.existsSync(reportsDir)) {
  console.error(`Error: Reports directory ${reportsDir} does not exist`);
  process.exit(1);
}

// Read all files in the lighthouse-reports directory
console.log(`Reading files from ${reportsDir} directory...`);
const files = fs.readdirSync(reportsDir);
console.log(`Found ${files.length} files: ${files.join(', ')}`);

// Filter for JSON report files
const jsonReports = files.filter(file => file.endsWith('.json') || file.endsWith('.report.json'));
console.log(`Found ${jsonReports.length} JSON reports`);

// Helper function to sanitize HTML content
function sanitizeHTML(text) {
  if (!text) return '';
  
  // First, escape HTML tags and convert backtick code sections
  let sanitized = text
    .replace(/\`([^\`]+)\`/g, (match, codeContent) => {
      // Pre-escape content inside backticks
      return `<code>${codeContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`;
    })
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Convert markdown links
  sanitized = sanitized.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  return sanitized;
}

// No longer need embedded CSS - using external stylesheet

// JavaScript for the HTML
const javaScript = `
  function toggleIssues(urlId) {
    const container = document.getElementById('issues-' + urlId);
    const button = document.getElementById('button-' + urlId);
    
    if (container.style.display === 'none' || container.style.display === '') {
      container.style.display = 'block';
      button.textContent = 'Hide Issues';
    } else {
      container.style.display = 'none';
      button.textContent = 'Show Issues';
    }
  }
  
  function expandAll() {
    document.querySelectorAll('.issues-container').forEach(container => {
      container.style.display = 'block';
    });
    document.querySelectorAll('.toggle-issues').forEach(button => {
      if (button.id.startsWith('button-')) {
        button.textContent = 'Hide Issues';
      }
    });
  }
  
  function collapseAll() {
    document.querySelectorAll('.issues-container').forEach(container => {
      container.style.display = 'none';
    });
    document.querySelectorAll('.toggle-issues').forEach(button => {
      if (button.id.startsWith('button-')) {
        button.textContent = 'Show Issues';
      }
    });
  }

  
  function toggleUrlVisibility(categoryId) {
    const urlTable = document.getElementById('table-' + categoryId);
    const toggleButton = document.getElementById('toggle-' + categoryId);
    
    if (urlTable.style.display === 'none' || urlTable.style.display === '') {
      urlTable.style.display = 'table';
      toggleButton.textContent = 'Hide URLs';
    } else {
      urlTable.style.display = 'none';
      toggleButton.textContent = 'Show URLs';
    }
  }
  
  function toggleAllUrls(show) {
    document.querySelectorAll('.url-table').forEach(table => {
      table.style.display = show ? 'table' : 'none';
    });
    
    document.querySelectorAll('.toggle-urls').forEach(button => {
      button.textContent = show ? 'Hide URLs' : 'Show URLs';
    });
  }
  
  // Hide all URL tables by default when page loads
  window.addEventListener('DOMContentLoaded', function() {
    toggleAllUrls(false);
  });
`;

// Start building the HTML
let summaryHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Lighthouse Accessibility Dashboard - ${baseName}</title>
  <link rel="stylesheet" href="styles.css">
  <script>${javaScript}</script>
</head>
<body>
  <h1>Lighthouse Accessibility Dashboard - ${baseName}</h1>
`;

// Read the URLs from the JSON file
let sitesByCategory = {};
try {
  if (fs.existsSync(path.join(__dirname, `../inputs/${inputFileName}`))) {
    const jsonContent = fs.readFileSync(path.join(__dirname, `../inputs/${inputFileName}`), 'utf8');
    sitesByCategory = JSON.parse(jsonContent);
    console.log(`Read ${Object.keys(sitesByCategory).length} categories from ${inputFileName}`);
    
    // Count total URLs
    const totalUrls = Object.values(sitesByCategory).reduce((total, urls) => total + urls.length, 0);
    console.log(`Total URLs in ${inputFileName}: ${totalUrls}`);
  } else {
    console.log(`${inputFileName} not found, will use report files to determine URLs`);
  }
} catch (error) {
  console.error(`Error reading ${inputFileName}:`, error);
}

// Process reports to get summary data
let totalScore = 0;
let totalIssues = 0;
let sitesWithIssues = 0;
let sitesPassing = 0; // Sites with 90+ score
let processedReports = 0;

const reportsData = jsonReports.map(reportFile => {
  try {
    const reportData = JSON.parse(
      fs.readFileSync(path.join(reportsDir, reportFile), 'utf8')
    );
    
    if (reportData.categories && reportData.categories.accessibility) {
      const url = reportData.requestedUrl || reportData.finalUrl || reportFile;
      const score = Math.round(reportData.categories.accessibility.score * 100);
      const issues = reportData.categories.accessibility.auditRefs
        .map(ref => reportData.audits[ref.id])
        .filter(audit => audit.score !== 1 && audit.score !== null);
      
      totalScore += score;
      totalIssues += issues.length;
      if (issues.length > 0) sitesWithIssues++;
      if (score >= 90) sitesPassing++;
      processedReports++;
      
      // Find which category this URL belongs to
      let category = 'Uncategorized';
      for (const [cat, urls] of Object.entries(sitesByCategory)) {
        // Normalize URLs for comparison (remove trailing slashes)
        const normalizedUrl = url.replace(/\/$/, '');
        const normalizedUrls = urls.map(u => u.replace(/\/$/, ''));
        
        if (normalizedUrls.includes(normalizedUrl)) {
          category = cat;
          break;
        }
      }
      
      return { url, score, issues, reportFile, category };
    }
  } catch (error) {
    console.error(`Error processing ${reportFile}:`, error);
  }
  return null;
}).filter(Boolean);

// Add summary statistics
const avgScore = processedReports > 0 ? Math.round(totalScore / processedReports) : 0;
const avgScoreClass = avgScore >= 90 ? 'good' : (avgScore >= 50 ? 'average' : 'poor');


summaryHTML += `
  <div class="stats">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Pages Tested</div>
        <div class="stat-value">${processedReports}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Average Score</div>
        <div class="stat-value"><span class="${avgScoreClass}">${avgScore}</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pages Passing (90+)</div>
        <div class="stat-value">${sitesPassing}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Issues</div>
        <div class="stat-value">${totalIssues}</div>
      </div>
    </div>
  </div>
`;

// Group reports by category
const reportsByCategory = {};
reportsData.forEach(report => {
  if (!reportsByCategory[report.category]) {
    reportsByCategory[report.category] = [];
  }
  reportsByCategory[report.category].push(report);
});

// Sort categories alphabetically
const sortedCategories = Object.keys(reportsByCategory).sort();

// For each category, add a section and table
sortedCategories.forEach(category => {
  const categoryReports = reportsByCategory[category];
  const categoryId = category.replace(/\s+/g, '-').toLowerCase();
  
  // Calculate category-specific stats
  let categoryScore = 0;
  let categoryIssues = 0;
  let categoryPassing = 0;
  
  categoryReports.forEach(report => {
    categoryScore += report.score;
    categoryIssues += report.issues.length;
    if (report.score >= 90) categoryPassing++;
  });
  
  const avgCategoryScore = Math.round(categoryScore / categoryReports.length);
  const avgCategoryClass = avgCategoryScore >= 90 ? 'good' : (avgCategoryScore >= 50 ? 'average' : 'poor');
  
  summaryHTML += `
  <div id="category-${categoryId}" class="category-section">
    
    <div class="category-stats">
      <span><strong>Pages:</strong> ${categoryReports.length}</span> | 
      <span><strong>Avg score:</strong> <span class="${avgCategoryClass}">${avgCategoryScore}</span></span> | 
      <span><strong>Passing:</strong> ${categoryPassing}</span> | 
      <span><strong>Issues:</strong> ${categoryIssues}</span>
    </div>
    
    <table id="table-${categoryId}" class="url-table">
      <tr>
        <th>URL</th>
        <th>Accessibility Score</th>
        <th>Issues</th>
        <th>Actions</th>
      </tr>
  `;
  
  // Sort reports by score (ascending, so worst scores first)
  categoryReports.sort((a, b) => a.score - b.score);
  
  // Add each report to the table
  categoryReports.forEach((report, index) => {
    const scoreClass = report.score >= 90 ? 'good' : (report.score >= 50 ? 'average' : 'poor');
    const urlId = `${categoryId}-${index}`;
    
    summaryHTML += `
      <tr data-url="${report.url}">
        <td><a href="${report.url}" target="_blank" class="url-link">${report.url}</a></td>
        <td><span class="${scoreClass}">${report.score}</span></td>
        <td>${report.issues.length}</td>
        <td>
          <button id="button-${urlId}" class="toggle-issues" onclick="toggleIssues('${urlId}')">Show Issues</button>
        </td>
      </tr>
      <tr class="issues-row">
        <td colspan="4">
          <div id="issues-${urlId}" class="issues-container">
    `;
    
    if (report.issues.length === 0) {
      summaryHTML += `<p>No accessibility issues found!</p>`;
    } else {
      report.issues.forEach(issue => {
        // Sanitize title and description
        const safeTitle = sanitizeHTML(issue.title || '');
        const safeDescription = sanitizeHTML(issue.description || '');
        
        summaryHTML += `
            <div class="issue">
              <h4>${safeTitle}</h4>
              <p>${safeDescription}</p>
        `;
        
        if (issue.details && issue.details.items && issue.details.items.length > 0) {
          summaryHTML += `<p><strong>Examples:</strong></p><ul>`;
          
          // Show up to 3 examples
          issue.details.items.slice(0, 3).forEach(item => {
            let itemDetails = '';
            for (const key in item) {
              if (item[key] && typeof item[key] === 'string') {
                const safeValue = sanitizeHTML(item[key]);
                itemDetails += `${key}: ${safeValue}, `;
              }
            }
            if (itemDetails) {
              summaryHTML += `<li>${itemDetails.slice(0, -2)}</li>`;
            }
          });
          
          if (issue.details.items.length > 3) {
            summaryHTML += `<li>... and ${issue.details.items.length - 3} more</li>`;
          }
          
          summaryHTML += `</ul>`;
        }
        
        summaryHTML += `
            </div>
        `;
      });
    }
    
    summaryHTML += `
          </div>
        </td>
      </tr>
    `;
  });
  
  summaryHTML += `
    </table>
  </div>
  `;
});

// Close HTML
summaryHTML += `
  <p>Generated on ${new Date().toLocaleString()}</p>
</body>
</html>
`;

// Write the summary HTML file
const outputPath = path.join(__dirname, `../../dist/${baseName}.html`);
fs.writeFileSync(outputPath, summaryHTML);
console.log(`Summary report created: ${outputPath}`);