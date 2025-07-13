import { Octokit } from '@octokit/rest';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

const GITHUB_REPO = process.env.GITHUB_REPO;
const [owner, repo] = GITHUB_REPO.split('/');
const USER_FILE = new URL('../data/users.json', import.meta.url).pathname;

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function createPullRequest(userName) {
  const branchName = `update-${userName.toLowerCase()}-${Date.now()}`;
  const base = process.env.GITHUB_BRANCH_BASE || 'main';

  const { data: baseRef } = await octokit.git.getRef({ owner, repo, ref: `heads/${base}` });

  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: baseRef.object.sha,
  });

  const fileContent = await fs.readFile(USER_FILE, 'utf-8');
  const encodedContent = Buffer.from(fileContent).toString('base64');

  const { data: currentFile } = await octokit.repos.getContent({
    owner,
    repo,
    path: 'data/users.json',
    ref: base,
  });

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'data/users.json',
    message: `Update user ${userName}`,
    content: encodedContent,
    branch: branchName,
    sha: currentFile.sha,
  });

  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: `Update user ${userName}`,
    head: branchName,
    base,
    body: `Automated update for ${userName} using AI agent.`,
  });

  return pr.html_url;
}