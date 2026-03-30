// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import render from './base.js';
import { escapeHTML as h, prettify } from './util.js';

export default (page, site) => {
  const label = page.confirm;
  const doConfirm = (label !== undefined);
  if (doConfirm) {
    page.scripts = ['/assets/confirm.js'];
    page.styles = ['/assets/message.css'];
    page.beforeHeadEnd = prettify(`\
<template id="confirm-section">
  <div class="post-info">
    <h2 class="post-label">${h(label)}</h2>
    <p class="confirm-color"><span id="confirm-icon" class="color-icon"></span></p>
  </div>
  <pre id="confirm-message" class="post-message"></pre>
</template>`);
  }
  return render(page, site, prettify(`\
<h1>${h(page.title)}</h1>
<p>${h(page.detail)}</p>${doConfirm ? `
<confirm-section></confirm-section>` : ''}`));
}
