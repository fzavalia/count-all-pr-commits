import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Octokit with your GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

interface CommitCount {
  [author: string]: number;
}

async function countCommitsByAuthor(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<CommitCount> {
  try {
    // Get all commits for the PR
    const { data: commits } = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100 // Adjust if you expect more than 100 commits
    });

    // Count commits by author
    const commitCount: CommitCount = {};
    
    for (const commit of commits) {
      const authorLogin = commit.author?.login || 'unknown';
      
      if (!commitCount[authorLogin]) {
        commitCount[authorLogin] = 0;
      }
      
      commitCount[authorLogin]++;
    }
    
    return commitCount;
  } catch (error) {
    console.error('Error fetching commits:', error);
    throw error;
  }
}

// Example usage
async function main() {
  // Get command line arguments
  const owner = process.argv[2];
  const repo = process.argv[3];
  const pullNumber = parseInt(process.argv[4], 10);
  
  if (!owner || !repo || isNaN(pullNumber)) {
    console.error('Usage: npm start -- <owner> <repo> <pull-number>');
    process.exit(1);
  }
  
  try {
    const commitCounts = await countCommitsByAuthor(owner, repo, pullNumber);
    
    console.log(`Commit counts for PR #${pullNumber} in ${owner}/${repo}:`);
    
    for (const [author, count] of Object.entries(commitCounts)) {
      console.log(`${author}: ${count} commits`);
    }
  } catch (error) {
    console.error('Failed to count commits:', error);
    process.exit(1);
  }
}

main();
