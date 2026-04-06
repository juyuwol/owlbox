// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

export function lockForm(form) {
  const { elements } = form;
  const locked = [];
  for (let i = elements.length - 1; i >= 0; --i) {
    const e = elements[i];
    if (e.disabled || e.readOnly) continue;
    if (e.matches(':read-write')) {
      e.readOnly = true;
      locked.push(e);
    } else if (e instanceof HTMLSelectElement) {
      // Disable all options except the selected one;
      // pre-decrement (--i) skips the selected index (ex).
      const { options, selectedIndex: ex } = e;
      const disable = (e) => {
        if (e.disabled) return;
        e.disabled = true;
        locked.push(e);
      };
      let i = options.length;
      for (--i; i > ex; --i) disable(options[i]);
      for (--i; i >= 0; --i) disable(options[i]);
    } else {
      e.disabled = true;
      locked.push(e);
    }
  }
  return locked;
}

export function unlockForm(locked) {
  for (const e of locked) {
    if (e.readOnly) {
      e.readOnly = false;
    } else {
      e.disabled = false;
    }
  }
}

export async function throwIfHttpError(res) {
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
