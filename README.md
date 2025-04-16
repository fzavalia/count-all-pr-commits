# Count Commits

A TypeScript utility to count how many commits an author has in a GitHub Pull Request, including commits from squashed PRs.

## Features

- Counts commits by author in a specified GitHub PR
- Recursively analyzes referenced PRs in squashed commits
- Detects PR references in commit messages with pattern `(#number)` or `#number`
- Skips merge commits to avoid duplicate counting
- Provides detailed output with commit counts per author

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure your GitHub token:
   Create a `.env` file in the project root and add your GitHub token:
   ```
   GITHUB_TOKEN=your_github_personal_access_token
   ```
   
   You can generate a personal access token at https://github.com/settings/tokens
   The token needs at least `repo` scope to access repository data.

3. Build the TypeScript code:
   ```
   npm run build
   ```

## Usage

Run the script with the following command:

```
npm start -- <owner> <repo> <pull-number>
```

For example:
```
npm start -- facebook react 12345
```

This will:
1. Fetch all commits in the specified PR
2. Detect any squashed PRs referenced in commit messages
3. Recursively fetch commits from those referenced PRs
4. Count and group all non-merge commits by author
5. Display a summary table of commits by author

## Example Output

```
Starting to fetch commits for PR #198 in owner/repo
Fetching commits for PR #198, page 1
Found 5 commits on page 1 for PR #198
Processing commit: abc1234
Commit abc1234 references PR #196, adding to queue
Processing commit: def5678
Added commit def5678 by user1
Processing commit: ghi9012
Commit ghi9012 references PR #212, adding to queue
...

Found a total of 27 unique commits across all related PRs

Commits by author:
┌─────────┬──────────┐
│ (index) │ Commits  │
├─────────┼──────────┤
│ user1   │ 15       │
│ user2   │ 8        │
│ user3   │ 4        │
└─────────┴──────────┘
```

## Security Note

This tool requires a GitHub personal access token to function. The token is stored in a local `.env` file which should never be committed to version control. The included `.gitignore` file is configured to exclude the `.env` file from git tracking.
