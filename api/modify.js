import { local, respondError, updateJSON } from '../src/vercel.js';
import site from '../config.js';

const offset = site.timeOffset;

function assign(data, updates) {
  const { sent } = Object.assign(data, updates);
  if (!sent.endsWith(offset)) data.sent = local(Date.parse(sent));
  return data;
}

export async function POST(req) {
  const timestamp = Date.now();
  let id = '', reply = '';
  try {
    ({ id, reply } = await req.json());
  } catch (error) {
    return respondError(400, error.message);
  }
  const path = `data/unproxied/${id}.json`;
  const replied = local(timestamp);
  try {
    await updateJSON(path, { replied, reply }, `Update ${id}`, assign);
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
