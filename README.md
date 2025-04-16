# Count Commits

A simple TypeScript utility to count how many commits an author has in a GitHub Pull Request.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure your GitHub token:
   Edit the `.env` file and replace `your_github_personal_access_token` with your actual GitHub token.
   
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

This will output the number of commits each author has made in the specified PR.

## Example Output

```
Commit counts for PR #12345 in facebook/react:
user1: 3 commits
user2: 1 commits
```
