// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { readdirSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';

const sep = (process.platform === 'win32') ? '\\' : '/';
const unproxiedDir = 'data' + sep + 'unproxied';
const files = readdirSync(unproxiedDir);
if (files.length > 0) {
  const posts = await Promise.all(files.map(async (name) => {
    const path = unproxiedDir + sep + name;
    const text = await readFile(path, 'utf-8');
    rm(path);
    return JSON.parse(text);
  }));
  const proxiedFile = 'data' + sep + 'proxied.jsonl';
  const text = posts.sort(compare).reduce((a, b) => a + JSON.stringify(b) + '\n', '');
  writeFile(proxiedFile, text, { encoding: 'utf-8', flag: 'a' });
}

// From ../src/build.js
function compare(b, a) {
  const aa = a.replied;
  const bb = b.replied;
  return (aa > bb) ? -1 : (aa !== bb) ? 1 : (a.id > b.id) ? -1 : 1;
}
