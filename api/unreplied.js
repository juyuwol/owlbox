// © 2023 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import { KV_KEY, kv, respondError } from '../src/vercel.js';

export async function DELETE(req) {
  const command = new URL(req.url).searchParams.getAll('id');
  if (command.length === 0) {
    return respondError(400, "At least one 'id' parameter is required.");
  }
  command.unshift('HDEL', KV_KEY);
  try {
    await kv(JSON.stringify(command), 'Failed to delete data.');
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
  const values = ids.sort().map(e => map.get(e));
  let body = '', type = '';
  if (req.url.endsWith('.json')) {
    body = `[${values.reverse().join(',')}]`;
    type = 'application/json';
  } else { // JSON Lines format
    body = values.join('\n');
    type = 'text/plain; charset=utf-8';
  }
  return new Response(body + '\n', {
    status: 200,
    headers: {
      'cache-control': 'no-store',
      'content-type': type,
    },
  });
}

export async function PUT(req) {
  const command = ['HSET', KV_KEY];
  try {
    if (req.headers.get('content-type') === 'application/json') {
      for (const e of await req.json()) {
        command.push(e.id, JSON.stringify(e));
      }
    } else { // JSON Lines format
      const text = await req.text();
      const lines = (text.endsWith('\n') ? text.slice(0, -1) : text).split('\n');
      for (const e of lines) {
        command.push(JSON.parse(e).id, e);
      }
    }
  } catch (error) {
    return respondError(400, error.message);
  }
  try {
    await kv(JSON.stringify(command), 'Failed to store the data.');
  } catch (error) {
    return respondError(500, error.message);
  }
  return new Response(null, {
    status: 204,
    headers: { 'cache-control': 'no-store' },
  });
}
