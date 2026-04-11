// © 2023 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import { readFile } from 'node:fs/promises';
import CanvasKitInit from 'canvaskit-wasm';
import { colors, fonts, style } from '../layouts/card.js';
import { ImageBuilder } from '../src/image.js';
import { ID_CHARS, KV_KEY, configGitHub, http, json, kv, local, respondError
} from '../src/vercel.js';
import site from '../config.js';

const { suffix } = site;
const initingCanvasKit = CanvasKitInit();
const fontDir = process.cwd() + '/fonts/';
const fontFiles = await Promise.all(fonts.map(e => readFile(fontDir + e)));
const CanvasKit = await initingCanvasKit;

export async function POST(req) {
  let id = '', sent = '', message = '', reply = '', color, spoiler;
  try {
    const body = await req.json();
    if (body?.constructor !== Object) {
      throw new TypeError('Request body must be a JSON object.');
    }
    ({ id, sent, message, reply, color, spoiler } = body);
    if ((typeof id !== 'string') || !ID_CHARS.test(id)) {
      throw new Error('Invalid "id" value.');
    } else if (typeof message !== 'string') {
      throw new TypeError('"message" must be a string.');
    }
  } catch (error) {
    return respondError(400, error.message);
  }

  const timestamp = Date.now();
  const hasColor = color ? colors.hasOwnProperty(color) : false;
  const imageStyle = hasColor ? { ...style, frameColor: colors[color] } : style;
  let safeMessage = message;
  if (spoiler) {
    const strs = safeMessage.split('`');
    if (strs.length > 1) {
      safeMessage = strs.reduce((a, b, i) => a + ((i % 2) ? '○'.repeat(b.length) : b));
    } else if (!reply.includes('`')) {
      spoiler = undefined;
    }
  }

  try {
    const image = ImageBuilder.generate(CanvasKit, fontFiles, imageStyle, safeMessage);
    const text = JSON.stringify({
      id,
      sent,
      message,
      replied: local(timestamp),
      reply,
      width: image.width,
      height: image.height,
      color,
      spoiler,
    }, undefined, 2) + '\n';

    const { baseURL, headers, branch } = configGitHub();
    const ref = `heads/${encodeURIComponent(branch)}`;
    const [
      { commit: { tree: { sha: baseTree } }, sha: parent },
      { sha: blob },
    ] = await Promise.all([
      // Get the contents of the last commit
      // https://docs.github.com/en/rest/commits/commits?apiVersion=2026-03-10#get-a-commit
      json(`${baseURL}/commits/${ref}`, {
        headers,
      }, 'Failed to get the last commit.'),

      // Create a blob of the image
      // https://docs.github.com/en/rest/git/blobs?apiVersion=2026-03-10#create-a-blob
      json(`${baseURL}/git/blobs`, {
        headers,
        method: 'POST',
        body: `{"content":"${Buffer.from(image).toString('base64')
        }","encoding":"base64"}`, // No need to escape a base64-encoded string
      }, 'Failed to create a blob of the image.'),
    ]);

    // Create a tree to edit the content of the repository
    // https://docs.github.com/en/rest/git/trees?apiVersion=2026-03-10#create-a-tree
    const { sha: tree } = await json(`${baseURL}/git/trees`, {
      headers,
      method: 'POST',
      body: `{"tree":[{"path":"data/unproxied/${id
      }.json","mode":"100644","type":"blob","content":${JSON.stringify(text)
      }},{"path":"public/images${suffix}/${id
      }.png","mode":"100644","type":"blob","sha":"${blob
      }"}],"base_tree":"${baseTree}"}`, // No need to escape sha and id
    }, 'Failed to create a tree.');

    // Create a commit that uses the tree created above
    // https://docs.github.com/en/rest/git/commits?apiVersion=2026-03-10#create-a-commit
    const { sha } = await json(`${baseURL}/git/commits`, {
      headers,
      method: 'POST',
      body: `{"message":"Publish ${id}","tree":"${tree
      }","parents":["${parent}"]}`, // No need to escape sha and id
    }, 'Failed to create a commit.');

    // Make the current branch point to the created commit
    // https://docs.github.com/en/rest/git/refs?apiVersion=2026-03-10#update-a-reference
    await http(`${baseURL}/git/refs/${ref}`, {
      headers,
      method: 'PATCH',
      body: `{"sha":"${sha}"}`, // No need to escape sha
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
