// Copyright 2024 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import site from '../config.js';

const STATUS_CODES = {
  400: 'Bad Request',
  500: 'Internal Server Error',
};

const { env } = process;
const { timeOffset: offset, timeOffsetMilliseconds: offsetMilliseconds } = site;

export const KV_KEY = env.VERCEL_PROJECT_ID;
export const ID_CHARS = /^[0-9a-z]{2,}$/;

export function configGitHub() {
  const {
    VERCEL_GIT_COMMIT_REF: branch,
    VERCEL_GIT_REPO_OWNER: owner,
    VERCEL_GIT_REPO_SLUG: repo,
  } = env;
  const baseURL = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    'User-Agent': site.generator.displayName,
    'X-GitHub-Api-Version': '2026-03-10',
  };
  return { baseURL, headers, branch };
}

export async function http(url, init, message, json = false) {
  try {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    if (json) return await res.json();
  } catch (error) {
    console.error(error);
    throw new Error(message);
  }
}

export function json(url, init, message) {
  return http(url, init, message, true);
}

export async function kv(command, message) {
  const res = await http(env.KV_REST_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.KV_REST_API_TOKEN}` },
    body: command,
  }, message, true);
  if ('error' in res) {
    console.error(res.error);
    throw new Error(message);
  }
  return res.result;
}

export function local(timestamp) {
  return new Date(timestamp + offsetMilliseconds).toISOString().slice(0, -1) + offset;
}

export function respondError(status, detail) {
  const title = STATUS_CODES[status]; // RFC 9457 problem details
  return new Response(JSON.stringify({ status, title, detail }), {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/problem+json',
    },
  });
}

export async function updateJSON(path, updates, message, updater) {
  const { baseURL, headers, branch } = configGitHub();
  const url = `${baseURL}/contents/${path}`;

  // Get the file content and sha
  // https://docs.github.com/en/rest/repos/contents?apiVersion=2026-03-10#get-repository-content
  const params = new URLSearchParams({ ref: branch });
  const { sha, content } = await json(`${url}?${params}`, {
    method: 'GET',
    headers,
  }, 'Failed to get the file.');

  const data = JSON.parse(Buffer.from(content, 'base64').toString());
  updater(data, updates);

  // Update the file content
  // https://docs.github.com/en/rest/repos/contents?apiVersion=2026-03-10#create-or-update-file-contents
  const text = JSON.stringify(data, undefined, 2) + '\n';
  await http(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      content: Buffer.from(text).toString('base64'),
      message,
      branch,
      sha,
    }),
  }, 'Failed to update the file.');
}
