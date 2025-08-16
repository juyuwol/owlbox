import { configGitHub, http, json, respondError } from '../src/vercel.js';

export async function DELETE(req) {
  const ids = new URL(req.url).searchParams.getAll('id');
  if (ids.length === 0) {
    return respondError(400, "At least one 'id' parameter is required.");
  }

  const files = [];
  for (const id of res) files.push(
    { mode: '100644', type: 'blob', sha: null, path: `data/unproxied/${id}.json` },
    { mode: '100644', type: 'blob', sha: null, path: `public/images/${id}.png` },
  );

  const { baseURL, headers, branch } = configGitHub();
  const ref = encodeURIComponent(branch);
  try {
    // Get the contents of the last commit
    // https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#get-a-commit
    const {
      commit: { tree: { sha: baseTree } },
      sha: commit,
    } = await json(`${baseURL}/commits/heads/${ref}`, {
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
        tree: files,
      }),
    }, 'Failed to create a tree.');

    // Create a commit that uses the tree created above
    // https://docs.github.com/en/rest/git/commits?apiVersion=2022-11-28#create-a-commit
    const { sha } = await json(`${baseURL}/git/commits`, {
      method: 'POST',
      headers, // No need to escape sha and id
      body: `{"message":"Delete ${ids.join(', ')}","parents":["${commit}"],"tree":"${tree}"}`,
    }, 'Failed to create a commit.');

    // Make the current branch point to the created commit
    // https://docs.github.com/en/rest/git/refs?apiVersion=2022-11-28#update-a-reference
    await http(`${baseURL}/git/refs/heads/${ref}`, {
      method: 'PATCH',
      headers, // No need to escape sha
      body: `{"sha":"${sha}"}`,
    }, 'Failed to update the ref.');
  } catch (error) {
    return respondError(500, error.message);
  }

  return new Response(null, {
    status: 204,
    headers: { 'cache-control': 'no-store' },
  });
}
