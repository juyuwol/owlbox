// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

export async function handleError(res) {
  if (res.ok) return res;
  let message = `HTTP ${res.status}`;
  if (res.headers.get('content-type') === 'application/problem+json') {
    const { title, detail } = await res.json();
    message += ` ${title}`;
    if (detail !== undefined) message += `: ${detail}`;
  } else {
    const { statusText } = res;
    if (statusText !== '') message += ` ${statusText}`;
    const body = await res.text();
    if (body.length !== 0) message += `: ${body}`;
  }
  throw new Error(message);
}
