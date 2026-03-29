// Copyright 2023 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import { KV_KEY, kv, respondError } from '../src/vercel.js';

const fromObject = (a, b) => a + `,"${b.id}",${JSON.stringify(JSON.stringify(b))}`;
const fromJSON = (a, b) => a + `,"${JSON.parse(b).id}",${JSON.stringify(b)}`;

export async function DELETE(req) {
  const ids = new URL(req.url).searchParams.getAll('id');
  if (ids.length === 0) {
    return respondError(400, "At least one 'id' parameter is required.");
  }
  try { // No need to escape id
    await kv(`["HDEL","${KV_KEY}","${ids.join('","')}"]`, 'Failed to delete data.');
  } catch (error) {
    return respondError(500, error.message);
  }
  return new Response(null, {
    status: 204,
    headers: { 'cache-control': 'no-store' },
  });
}

export async function GET(req) {
  const map = new Map();
  const ids = [];
  try {
    const result = await kv(`["HGETALL","${KV_KEY}"]`, 'Failed to get data.');
    for (let i = result.length - 1; i > 0; --i) {
      const value = result[i];
      const id = result[--i];
      map.set(id, value);
      ids.push(id);
    }
  } catch (error) {
    return respondError(500, error.message);
  }
  ids.sort();
  let body = '', type = '';
  if (req.url.endsWith('.json')) {
    body = `[${ids.reduceRight((a, b) => a + ',' + map.get(b), '').slice(1)}]\n`;
    type = 'application/json';
  } else { // JSON Lines format
    body = ids.reduce((a, b) => a + map.get(b) + '\n', '');
    type = 'text/plain; charset=utf-8';
  }
  return new Response(body, {
    status: 200,
    headers: {
      'cache-control': 'no-store',
      'content-type': type,
    },
  });
}

export async function PUT(req) {
  let pairs = '';
  try { // No need to escape id
    if (req.headers.get('content-type') === 'application/json') {
      const posts = await req.json();
      pairs = posts.reduce(fromObject, '');
    } else { // JSON Lines format
      const text = await req.text();
      const lines = (text.endsWith('\n') ? text.slice(0, -1) : text).split('\n');
      pairs = lines.reduce(fromJSON, '');
    }
  } catch (error) {
    return respondError(400, error.message);
  }
  try {
    await kv(`["HSET","${KV_KEY}"${pairs}]`, 'Failed to store the data.');
  } catch (error) {
    return respondError(500, error.message);
  }
  return new Response(null, {
    status: 204,
    headers: { 'cache-control': 'no-store' },
  });
}
