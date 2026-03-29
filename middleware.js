// Copyright 2023 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import { next, rewrite } from '@vercel/functions/middleware';

const { USERNAME, PASSWORD } = process.env;
const CREDENTIALS = `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`;

const unauthorized = new Response(null, {
  status: 401,
  headers: {
    'cache-control': 'no-store',
    'www-authenticate': 'Basic realm="Restricted"',
  },
});

export const config = {
  matcher: [
    '/(box|api)/:path*',
    '/404.html',
  ],
};

export default function middleware(req) {
  if (new URL(req.url).pathname.charCodeAt(1) !== 0x62) { // b: U+0062
    return rewrite('/404.html', { status: 404 });
  } else if (req.headers.get('authorization') === CREDENTIALS) {
    return next();
  } else {
    return unauthorized;
  }
}
