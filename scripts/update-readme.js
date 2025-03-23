
#!/usr/bin/env node

/**
 * This script updates the README.md file with new changelog entries
 * It can be used as a git hook or in a CI/CD pipeline
 * 
 * Usage: node scripts/update-readme.js
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Path to README.md file
const readmePath = path.join(__dirname, '..', 'README.md');

// Function to get the latest commit message
function getLatestCommitMessage() {
  try {
    // Get the latest commit message
    const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
    return commitMessage;
  } catch (error) {
    console.error('Error getting latest commit message:', error);
    return null;
  }
}

// Function to update the README.md file
function updateReadme() {
  try {
    // Read the current README content
    const readmeContent = fs.readFileSync(readmePath, 'utf8');

    // Get the latest commit message
    const commitMessage = getLatestCommitMessage();
    if (!commitMessage) {
      console.error('No commit message found');
      return;
    }

    // Get current date in YYYY-MM-DD format
    const date = new Date().toISOString().split('T')[0];

    // Format the new changelog entry
    const changelogEntry = `### [Unreleased] - ${date}\n- ${commitMessage}\n`;

    // Find the Changelog section
    const changelogSectionRegex = /## Changelog\s+/;
    const match = readmeContent.match(changelogSectionRegex);

    if (match) {
      // If Changelog section exists, insert the new entry after the heading
      const position = match.index + match[0].length;
      const updatedReadme = 
        readmeContent.substring(0, position) + 
        changelogEntry + 
        readmeContent.substring(position);
      
      fs.writeFileSync(readmePath, updatedReadme);
      console.log('README.md updated with new changelog entry');
    } else {
      // If no Changelog section exists, add it at the end
      const updatedReadme = readmeContent + '\n\n## Changelog\n\n' + changelogEntry;
      fs.writeFileSync(readmePath, updatedReadme);
      console.log('README.md updated with new Changelog section');
    }
  } catch (error) {
    console.error('Error updating README.md:', error);
  }
}

// Run the update
updateReadme();
