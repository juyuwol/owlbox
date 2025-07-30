import { configGitHub, http, json, respondError } from '../src/vercel.js';

async function deletePosts(ids) {
  const { baseURL, headers, branch } = configGitHub();

  // Get the contents of the last commit
  // https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#get-a-commit
  const {
    commit: { tree: { sha: baseTree } },
    sha: commit,
  } = await json(`${baseURL}/commits/heads/${branch}`, {
    method: 'GET',
    headers,
  }, 'Failed to get the last commit.');

  // Create a tree to edit the content of the repository
  // https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28#create-a-tree
  const { sha: tree } = await json(`${baseURL}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTree,
      tree: [...ids.values().map(toData), ...ids.values().map(toImage)],
    }),
  }, 'Failed to create a tree.');

  // Create a commit that uses the tree created above
  // https://docs.github.com/en/rest/git/commits?apiVersion=2022-11-28#create-a-commit
  const { sha } = await json(`${baseURL}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: `Delete ${ids.join(', ')}`,
      parents: [commit],
      tree,
    }),
  }, 'Failed to create a commit.');

  // Make the current branch point to the created commit
  // https://docs.github.com/en/rest/git/refs?apiVersion=2022-11-28#update-a-reference
  await http(`${baseURL}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: `{"sha":"${sha}"}`, // No need to escape sha
  }, 'Failed to update the ref.');
}

function toData(id) {
  return { mode: '100644', type: 'blob', sha: null, path: `data/unproxied/${id}.json` };
}

function toImage(id) {
  return { mode: '100644', type: 'blob', sha: null, path: `public/images/${id}.png` };
}

export async function DELETE(req) {
  let ids;
  try {
    ids = await req.json();
  } catch (error) {
    return respondError(400, error.message);
  }
  try {
    await deletePosts(ids);
  } catch (error) {
    return respondError(500, error.message);
  }
  return new Response(null, {
    status: 204,
    headers: { 'cache-control': 'no-store' },
  });
}
