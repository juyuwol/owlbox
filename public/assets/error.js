// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

export async function handleError(res) {
  if (res.ok) return res;
  let message = `HTTP ${res.status}`;
  if (res.headers.get('content-type') === 'application/problem+json') {
    const { title, detail } = await res.json();
    message += ` ${title}`;
    if (detail) message += `: ${detail}`;
  } else {
    const { statusText } = res;
    const body = await res.text();
    if (statusText) message += ` ${statusText}`;
    if (body) message += `: ${body}`;
  }
  throw new Error(message);
}
