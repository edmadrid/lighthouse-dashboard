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

// CSS styles for the HTML
const cssStyles = `
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; 
    max-width: 1200px; 
    margin: 0 auto; 
    padding: 20px; 
    line-height: 1.5;
  }
  h1 { 
    color: #333; 
  }
  h2 {
    font-size: 2rem;
    font-weight: 300;
    margin: 0;
  }
  table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-bottom: 30px;
  }
  th, td { 
    border: 1px solid #ddd; 
    padding: 12px; 
    text-align: left; 
  }
  th { 
    background-color: #fff; 
    font-weight: 600;
  }
  .good { 
    background-color: #0cce6b; 
    color: white; 
    font-weight: bold; 
    padding: 5px 10px;
    border-radius: 4px;
  }
  .average { 
    background-color: #ffa400; 
    color: white; 
    font-weight: bold; 
    padding: 5px 10px;
    border-radius: 4px;
  }
  .poor { 
    background-color: #ff4e42; 
    color: white; 
    font-weight: bold; 
    padding: 5px 10px;
    border-radius: 4px;
  }
  .issues-container {
    margin-top: 10px;
    display: none;
    background-color: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 15px;
  }
  .issue { 
    margin-bottom: 20px; 
    padding: 15px; 
    background-color: white; 
    border-left: 4px solid #ff4e42; 
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .issue h4 { 
    margin-top: 0; 
    color: #333;
  }
  .issue p {
    color: #555;
    margin-bottom: 10px;
  }
  .toggle-issues {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 4px;
    display: inline-block;
    margin-top: 5px;
    font-size: 14px;
    transition: background-color 0.2s;
  }
  .toggle-issues:hover {
    background-color: #e9e9e9;
  }
  .url-link {
    color: #0366d6;
    text-decoration: none;
  }
  .url-link:hover {
    text-decoration: underline;
  }
  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .stats {
    background-color: #f5f5f5;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    grid-gap: 15px;
  }
  .stat-card {
    background: white;
    padding: 15px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .stat-value {
    font-size: 24px;
    font-weight: bold;
    margin: 5px 0;
  }
  .stat-label {
    color: #666;
    font-size: 14px;
  }
  tr:nth-child(even) {
    background-color: #fff;
  }
  tr:nth-child(even):hover {
    background-color: #f5f5f5;
  }
  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    padding: 10px 15px;
    margin: 15px 0 0 0;
    border: 1px solid #ddd;
  }
  .category-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #333;
  }
  .category-stats {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 14px;
    color: #555;
    padding: 8px;
    background: #eee;
  }
  .category-stats span {
    white-space: nowrap;
  }
  code {
    background-color: #f0f0f0;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.9em;
  }
`;

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
  <style>${cssStyles}</style>
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
        <div class="stat-label">Sites Tested</div>
        <div class="stat-value">${processedReports}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Average Score</div>
        <div class="stat-value"><span class="${avgScoreClass}">${avgScore}</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sites Passing (90+)</div>
        <div class="stat-value">${sitesPassing}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Issues</div>
        <div class="stat-value">${totalIssues}</div>
      </div>
    </div>
  </div>
  
  
  <div class="summary-header">
    <h2>Site Scores</h2>
    <div>
      <button onclick="expandAll()" class="toggle-issues">Expand All Issues</button>
      <button onclick="collapseAll()" class="toggle-issues">Collapse All Issues</button>
      <button onclick="toggleAllUrls(true)" class="toggle-issues">Show All URLs</button>
      <button onclick="toggleAllUrls(false)" class="toggle-issues">Hide All URLs</button>
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
    <div class="category-header">
      <h3 class="category-title">${category}</h3>
      <button id="toggle-${categoryId}" class="toggle-issues toggle-urls" onclick="toggleUrlVisibility('${categoryId}')">Show URLs</button>
    </div>
    
    <div class="category-stats">
      <span><strong>Sites:</strong> ${categoryReports.length}</span> | 
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