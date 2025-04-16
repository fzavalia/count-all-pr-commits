import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import dotenv from "dotenv";

type Commit =
  RestEndpointMethodTypes["pulls"]["listCommits"]["response"]["data"][number];

async function main() {
  // Load environment variables from .env file
  dotenv.config();

  // Initialize GitHub API client with authentication token
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  // Extract command line arguments
  const owner = process.argv[2];
  const repo = process.argv[3];
  const pr = parseInt(process.argv[4], 10);

  // Validate required arguments
  if (!owner || !repo || isNaN(pr)) {
    console.error("Usage: npm start -- <owner> <repo> <pull-number>");

    process.exit(1);
  }

  const commits: Commit[] = [];
  const processedPrs = new Set<number>();
  const remainingPrs: number[] = [pr];

  // Track pagination
  let page = 1;

  console.log(`Starting to fetch commits for PR #${pr} in ${owner}/${repo}`);

  // Process all PRs in the queue
  while (remainingPrs.length > 0) {
    const currentPr = remainingPrs[0];

    // Skip if we've already processed this PR
    if (processedPrs.has(currentPr)) {
      console.log(`PR #${currentPr} already processed, skipping`);

      remainingPrs.shift();
      continue;
    }

    console.log(`Fetching commits for PR #${currentPr}, page ${page}`);

    // Get commits for the current PR
    const response = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: currentPr,
      per_page: 100,
      page,
    });

    // If no commits on this page, move to next PR
    if (response.data.length === 0) {
      console.log(`No more commits found for PR #${currentPr}`);

      processedPrs.add(currentPr);
      page = 1;
      remainingPrs.shift();
      continue;
    }

    console.log(
      `Found ${response.data.length} commits on page ${page} for PR #${currentPr}`
    );

    for (let i = 0; i < response.data.length; i++) {
      const commit = response.data[i];
      console.log(`Processing commit: ${commit.sha.substring(0, 7)}`);

      // Check if commit message references another PR (squash merge)
      const squashMatch = commit.commit.message
        .split("\n")[0]
        .match(/(?:\(#|\s#)(\d+)(?:\)|$)/);

      if (squashMatch) {
        const squashPr = parseInt(squashMatch[1], 10);
        console.log(
          `Commit ${commit.sha.substring(
            0,
            7
          )} references PR #${squashPr}, adding to queue`
        );
        remainingPrs.push(squashPr);
      } else {
        // Add non-reference commit to our collection
        commits.push(commit);
        console.log(
          `Added commit ${commit.sha.substring(0, 7)} by ${
            commit.author?.login || "unknown"
          }`
        );
      }
    }

    // Move to next page
    page++;
  }

  console.log(
    `Found a total of ${commits.length} unique commits across all related PRs`
  );

  // Group commits by author
  const commitsByAuthor = commits.reduce((acc, commit) => {
    const author = commit.author?.login || "unknown";
    acc[author] = (acc[author] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Print results
  console.log("\nCommits by author:");
  for (const [author, count] of Object.entries(commitsByAuthor)) {
    console.log(`${author}: ${count}`);
  }
}

main();
