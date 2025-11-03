import render from './base.js';
import { escapeHTML as h, prettify } from './util.js';

export default (page, site) => {
  const label = page.confirm;
  const doConfirm = (label !== undefined);
  if (doConfirm) {
    page.scripts = ['/assets/confirm.js'];
    page.beforeHeadEnd = prettify(`\
<template id="confirm-section">
  <h2 class="post-label">${h(label)}</h2>
  <pre id="confirm-message" class="post-message"></pre>
</template>`);
  }
  return render(page, site, prettify(`\
<h1>${h(page.title)}</h1>
<p>${h(page.detail)}</p>${doConfirm ? `
<confirm-section></confirm-section>` : ''}`));
}
