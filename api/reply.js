import { readFile } from 'node:fs/promises';
import CanvasKitInit from 'canvaskit-wasm';
import { fonts, style } from '../layouts/card.js';
import { ImageBuilder } from '../src/image.js';
import { KV_KEY, configGitHub, http, json, kv, local, respondError } from '../src/vercel.js';

const dir = process.cwd();
const initingCanvasKit = CanvasKitInit();
const fontFiles = await Promise.all(fonts.map(e => readFile(`${dir}/fonts/${e}`)));
const CanvasKit = await initingCanvasKit;

export async function POST(req) {
  const timestamp = Date.now();
  let id = '', sent = '', message = '', reply = '';
  try {
    ({ id, sent, message, reply } = await req.json());
  } catch (error) {
    return respondError(400, error.message);
  }

  const { baseURL, headers, branch } = configGitHub();
  const ref = encodeURIComponent(branch);
  const replied = local(timestamp);
  try {
    const image = ImageBuilder.generate(CanvasKit, fontFiles, style, message);

    const { width, height } = image;
    const post = { id, sent, message, replied, reply, width, height };
    const content = JSON.stringify(post, undefined, 2) + '\n';

    const [
      { commit: { tree: { sha: baseTree } }, sha: commit },
      { sha: blob },
    ] = await Promise.all([
      // Get the contents of the last commit
      // https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#get-a-commit
      json(`${baseURL}/commits/heads/${ref}`, {
        method: 'GET',
        headers,
      }, 'Failed to get the last commit.'),

      // Create a blob of the image
      // https://docs.github.com/en/rest/git/blobs?apiVersion=2022-11-28#create-a-blob
      json(`${baseURL}/git/blobs`, {
        method: 'POST',
        headers, // No need to escape a base64-encoded string
        body: `{"content":"${Buffer.from(image).toString('base64')}","encoding":"base64"}`,
      }, 'Failed to create a blob of the image.'),
    ]);

    // Create a tree to edit the content of the repository
    // https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28#create-a-tree
    const { sha: tree } = await json(`${baseURL}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTree,
        tree: [
          { mode: '100644', type: 'blob', path: `data/unproxied/${id}.json`, content },
          { mode: '100644', type: 'blob', path: `public/images/${id}.png`, sha: blob },
        ],
      }),
    }, 'Failed to create a tree.');

    // Create a commit that uses the tree created above
    // https://docs.github.com/en/rest/git/commits?apiVersion=2022-11-28#create-a-commit
    const { sha } = await json(`${baseURL}/git/commits`, {
      method: 'POST',
      headers, // No need to escape sha and id
      body: `{"message":"Publish ${id}","parents":["${commit}"],"tree":"${tree}"}`,
    }, 'Failed to create a commit.');

    // Make the current branch point to the created commit
    // https://docs.github.com/en/rest/git/refs?apiVersion=2022-11-28#update-a-reference
    await http(`${baseURL}/git/refs/heads/${ref}`, {
      method: 'PATCH',
      headers, // No need to escape sha
      body: `{"sha":"${sha}"}`,
    }, 'Failed to update the ref.');

    // Remove the message from the unreplied database
    const command = `["HDEL","${KV_KEY}","${id}"]`; // No need to escape id
    await kv(command, 'Failed to remove data from database.').catch(console.error);

    return new Response(image, {
      status: 200,
      headers: { // Respond the image with datetime
        'cache-control': 'no-store',
        'content-type': 'image/png',
        'last-modified': new Date(timestamp).toUTCString(),
      },
    });
  } catch (error) {
    return respondError(500, error.message);
  }
}
