#!/bin/bash

echo "Starting Lighthouse Accessibility Audit..."

# Run the lighthouse-batch
./lighthouse-batch-script.sh

# Create generate-summary.js script
cat > ./generate-summary.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Define the reports directory path
const reportsDir = path.join(__dirname, '../../dist/lighthouse-reports');

// Read all files in the lighthouse-reports directory
console.log('Reading files from lighthouse-reports directory...');
const files = fs.readdirSync(reportsDir);
console.log(`Found ${files.length} files: ${files.join(', ')}`);

// Filter for JSON report files
const jsonReports = files.filter(file => file.endsWith('.json') || file.endsWith('.report.json'));
console.log(`Found ${jsonReports.length} JSON reports`);

// Create empty summary HTML
let summaryHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Lighthouse Accessibility Dashboard</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; 
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 20px; 
      line-height: 1.5;
    }
    h1 { 
      color: #333; 
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 30px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 12px; 
      text-align: left; 
    }
    th { 
      background-color: #f5f5f5; 
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
      background-color: #f9f9f9;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
  </style>
  <script>
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
        button.textContent = 'Hide Issues';
      });
    }
    
    function collapseAll() {
      document.querySelectorAll('.issues-container').forEach(container => {
        container.style.display = 'none';
      });
      document.querySelectorAll('.toggle-issues').forEach(button => {
        button.textContent = 'Show Issues';
      });
    }
  </script>
</head>
<body>
  <h1>Lighthouse Accessibility Dashboard</h1>
`;

// Read the list of URLs from sites.txt
let urls = [];
try {
  if (fs.existsSync(path.join(__dirname, '../inputs/sites.txt'))) {
    const fileContent = fs.readFileSync(path.join(__dirname, '../inputs/sites.txt'), 'utf8');
    urls = fileContent.split('\n').filter(url => url.trim() !== '');
    console.log(`Read ${urls.length} URLs from sites.txt`);
  } else {
    console.log('sites.txt not found, will use report files to determine URLs');
  }
} catch (error) {
  console.error('Error reading sites.txt:', error);
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
      
      return { url, score, issues, reportFile };
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
      <button onclick="expandAll()" class="toggle-issues">Expand All</button>
      <button onclick="collapseAll()" class="toggle-issues">Collapse All</button>
    </div>
  </div>
  
  <table>
    <tr>
      <th>URL</th>
      <th>Accessibility Score</th>
      <th>Issues</th>
      <th>Actions</th>
    </tr>
`;

// Sort reports by score (ascending, so worst scores first)
reportsData.sort((a, b) => a.score - b.score);

// Add each report to the table
reportsData.forEach((report, index) => {
  const scoreClass = report.score >= 90 ? 'good' : (report.score >= 50 ? 'average' : 'poor');
  const urlId = `url-${index}`;
  
  summaryHTML += `
    <tr>
      <td><a href="${report.url}" target="_blank" class="url-link">${report.url}</a></td>
      <td><span class="${scoreClass}">${report.score}</span></td>
      <td>${report.issues.length}</td>
      <td>
        <button id="button-${urlId}" class="toggle-issues" onclick="toggleIssues('${urlId}')">Show Issues</button>
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <div id="issues-${urlId}" class="issues-container">
  `;
  
  if (report.issues.length === 0) {
    summaryHTML += `<p>No accessibility issues found!</p>`;
  } else {
    report.issues.forEach(issue => {
      summaryHTML += `
          <div class="issue">
            <h4>${issue.title}</h4>
            <p>${issue.description}</p>
      `;
      
      if (issue.details && issue.details.items && issue.details.items.length > 0) {
        summaryHTML += `<p><strong>Examples:</strong></p><ul>`;
        
        // Show up to 3 examples
        issue.details.items.slice(0, 3).forEach(item => {
          let itemDetails = '';
          for (const key in item) {
            if (item[key] && typeof item[key] === 'string') {
              itemDetails += `${key}: ${item[key]}, `;
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

// Close HTML
summaryHTML += `
  </table>
  <p>Generated on ${new Date().toLocaleString()}</p>
</body>
</html>
`;

// Write the summary HTML file
fs.writeFileSync(path.join(__dirname, '../../dist/accessibility-summary.html'), summaryHTML);
console.log('Summary report created: ../../dist/accessibility-summary.html');
EOF

# Run the report generator
echo "Generating summary report..."
node generate-summary.js

echo "Audit complete! Open dist/accessibility-summary.html in your browser to view the results."