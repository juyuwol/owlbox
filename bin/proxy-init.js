// © 2025 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import { readFile, writeFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { parseArgs } from 'node:util';

const IMAGE_SOURCE = '/images/:path';
const IMAGE_DEST = '/images/:path';
const POST_SOURCE = '/posts/:path.html';
const POST_DEST = '/posts/:path';

let { output, url } = parseArgs({
  options: {
    output: { type: 'string' },
    url: { type: 'string' },
  }
}).values;

if (output === undefined) {
  throw new Error('No `output` argument');
} else if (url === undefined) {
  throw new Error('No `url` argument');
}

output = relative(process.cwd(), output);
try { // Normalize the URL
  const { href, pathname, search, hash } = new URL(url);
  if ((pathname !== '/') || (search.length + hash.length !== 0)) {
    throw new Error();
  }
  url = href.slice(0, -1);
} catch (error) {
  throw new Error('Invalid URL');
}

readFile('package.json', 'utf-8').then((text) => {
  const data = JSON.parse(text);
  const command = `node bin/proxy.js && node src/build.js -o '${output}' --proxy`;
  const { scripts } = data;
  if (scripts?.constructor === Object) {
    scripts.proxy = command;
  } else {
    data.scripts = { proxy: command };
  }
  return writeFile('package.json', JSON.stringify(data, undefined, 2) + '\n');
});

// https://vercel.com/docs/project-configuration#rewrites
readFile('vercel.json', 'utf-8').then((text) => {
  const data = JSON.parse(text);
  const postRule = { source: POST_SOURCE, destination: url + POST_DEST };
  const imageRule = { source: IMAGE_SOURCE, destination: url + IMAGE_DEST };
  const { rewrites } = data;
  if (Array.isArray(rewrites)) {
    let hasImageRule = false;
    let hasPostRule = false;
    for (const rule of rewrites) {
      const { source } = rule;
      if (source === POST_SOURCE) {
        rule.destination = postRule.destination;
        hasPostRule = true;
        if (hasImageRule) break;
      } else if (source === IMAGE_SOURCE) {
        rule.destination = imageRule.destination;
        hasImageRule = true;
        if (hasPostRule) break;
      }
    }
    if (!hasPostRule) rewrites.push(postRule);
    if (!hasImageRule) rewrites.push(imageRule);
  } else {
    data.rewrites = [postRule, imageRule];
  }
  return writeFile('vercel.json', JSON.stringify(data, undefined, 2) + '\n');
});
