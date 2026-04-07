// © 2023 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import { ID_CHARS, configGitHub, http, json, local, respondError, updateJSON
} from '../src/vercel.js';
import site from '../config.js';

const { suffix, timeOffset } = site;

const isInvalidId = (id) => !ID_CHARS.test(id);
const concatTreeEntries = (entries, id) => `${entries
},{"mode":"100644","type":"blob","sha":null,"path":"data/unproxied/${id
}.json"},{"mode":"100644","type":"blob","sha":null,"path":"public/images${suffix
}/${id}.png"}`;

function updatePost(post, updates) {
  const { sent, spoiler = false } = Object.assign(post, updates);
  if (!sent.endsWith(timeOffset)) post.sent = local(Date.parse(sent));
  if (spoiler && !post.message.includes('`') && !post.reply.includes('`')) {
    delete post.spoiler;
  }
  return post;
}

export async function DELETE(req) {
  const ids = new URL(req.url).searchParams.getAll('id');
  try {
    if (ids.length === 0) {
      throw new Error('At least one "id" parameter is required.');
    } else if (ids.some(isInvalidId)) {
      throw new Error('One or more "id" values are invalid.');
    }
  } catch (error) {
    return respondError(400, error.message);
  }

  try {
    const { baseURL, headers, branch } = configGitHub();
    const ref = `heads/${encodeURIComponent(branch)}`;

    // Get the contents of the last commit
    // https://docs.github.com/en/rest/commits/commits?apiVersion=2026-03-10#get-a-commit
    const {
      commit: { tree: { sha: baseTree } },
      sha: parent,
    } = await json(`${baseURL}/commits/${ref}`, {
      method: 'GET',
      headers,
    }, 'Failed to get the last commit.');

    // Create a tree to edit the content of the repository
    // https://docs.github.com/en/rest/git/trees?apiVersion=2026-03-10#create-a-tree
    const { sha: tree } = await json(`${baseURL}/git/trees`, {
      method: 'POST',
      headers,
      body: `{"tree":[${ids.reduce(concatTreeEntries, '').slice(1)
      }],"base_tree":"${baseTree}"}`, // No need to escape sha
    }, 'Failed to create a tree.');

    // Create a commit that uses the tree created above
    // https://docs.github.com/en/rest/git/commits?apiVersion=2026-03-10#create-a-commit
    const { sha } = await json(`${baseURL}/git/commits`, {
      method: 'POST',
      headers,
      body: `{"message":"Delete ${ids.join(', ')}"},"tree":"${tree
      }","parents":["${parent}"]}`, // No need to escape id and sha
    }, 'Failed to create a commit.');

    // Make the current branch point to the created commit
    // https://docs.github.com/en/rest/git/refs?apiVersion=2026-03-10#update-a-reference
    await http(`${baseURL}/git/refs/${ref}`, {
      method: 'PATCH',
      headers,
      body: `{"sha":"${sha}"}`, // No need to escape sha
    }, 'Failed to update the ref.');
  } catch (error) {
    return respondError(500, error.message);
  }

  return new Response(null, {
    status: 204,
    headers: { 'cache-control': 'no-store' },
  });
}

export async function POST(req) {
  let id = '', reply = '';
  try {
    const body = await req.json();
    if (body?.constructor !== Object) {
      throw new TypeError('Request body must be a JSON object.');
    }
    ({ id, reply } = body);
    if ((typeof id !== 'string') || !ID_CHARS.test(id)) {
      throw new Error('Invalid "id" value.');
    } else if (typeof reply !== 'string') {
      throw new TypeError('"reply" must be a string.');
    }
  } catch (error) {
    return respondError(400, error.message);
  }
  const timestamp = Date.now();
  try {
    const path = `data/unproxied/${id}.json`;
    const replied = local(timestamp);
    await updateJSON(path, { replied, reply }, `Update ${id}`, updatePost);
  } catch (error) {
    return respondError(500, error.message);
  }
  return new Response(null, {
    status: 204,
    headers: {
      'cache-control': 'no-store',
      'last-modified': new Date(timestamp).toUTCString(),
    },
  });
}
