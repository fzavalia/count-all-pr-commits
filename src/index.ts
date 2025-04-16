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

interface CommitResult {
  counts: CommitCount;
  processedPRs: number[];
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

/**
 * Count commits by author in a PR, including commits from squashed PRs
 * Recursively processes PRs referenced in commit messages with pattern (#number)
 */
async function countCommitsByAuthorWithSquashedPRs(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<CommitResult> {
  const processedPRs = new Set<number>([pullNumber]);
  const counts = await countCommitsByAuthorRecursive(owner, repo, pullNumber, processedPRs);
  
  return { 
    counts, 
    processedPRs: Array.from(processedPRs) 
  };
}

/**
 * Recursively count commits by author in a PR and any referenced PRs
 */
async function countCommitsByAuthorRecursive(
  owner: string,
  repo: string,
  pullNumber: number,
  processedPRs: Set<number>
): Promise<CommitCount> {
  try {
    // Get direct commits for this PR
    const { data: commits } = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100
    });
    
    // Count commits by author
    const commitCount: CommitCount = {};
    
    for (const commit of commits) {
      const authorLogin = commit.author?.login || 'unknown';
      const message = commit.commit.message.trim();
      
      if (!commitCount[authorLogin]) {
        commitCount[authorLogin] = 0;
      }
      
      commitCount[authorLogin]++;
      
      // Check if this is a squashed commit by looking for (#number) pattern
      // The pattern can be anywhere in the message, not just at the end
      const squashMatch = message.match(/\(#(\d+)\)/);
      
      
      if (squashMatch) {
        const referencedPR = parseInt(squashMatch[1], 10);
        
        // Skip if we've already processed this PR
        if (!processedPRs.has(referencedPR)) {
          processedPRs.add(referencedPR);
          
          try {
            // Process the referenced PR recursively
            
            // Recursively get commits from the referenced PR
            const nestedCounts = await countCommitsByAuthorRecursive(
              owner,
              repo,
              referencedPR,
              processedPRs
            );
            
            // Merge the counts
            for (const [author, count] of Object.entries(nestedCounts)) {
              commitCount[author] = (commitCount[author] || 0) + count;
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`Could not process referenced PR #${referencedPR}: ${errorMessage}`);
          }
        }
      }
    }
    
    return commitCount;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error processing PR #${pullNumber}: ${errorMessage}`);
    return {};
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
    const result = await countCommitsByAuthorWithSquashedPRs(owner, repo, pullNumber);
    
    console.log(`Commit counts for PR #${pullNumber} in ${owner}/${repo}:`);
    
    // Sort authors by commit count (descending)
    const sortedAuthors = Object.entries(result.counts)
      .sort(([, countA], [, countB]) => countB - countA);
    
    for (const [author, count] of sortedAuthors) {
      console.log(`${author}: ${count} commits`);
    }
    
    if (result.processedPRs.length > 1) {
      console.log(`\nIncluded commits from these PRs: ${result.processedPRs.join(', ')}`);
    }
  } catch (error) {
    console.error('Failed to count commits:', error);
    process.exit(1);
  }
}

main();
