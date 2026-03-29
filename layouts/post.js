// Copyright 2023 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import includePostContent from './parts/post-content.js';
import render from './base.js';
import { escapeHTML as h, pretty } from './util.js';

const scriptsModule = ['/assets/post.js'];

export default (page, site) => {
  const { reply } = page;
  const query = new URLSearchParams({ text: `${reply} ${page.permalink}` });
  page.canonical = true;
  page.scriptsModule = scriptsModule;
  return render(page, site, pretty`\
<article>
  <div class="post-header">
    <h1 class="post-title">${h(page.title)}</h1>
    <p class="post-setting"><label class="label-checkbox">\
<input id="image-toggle" type="checkbox" autocomplete="off" disabled=""> \
이미지 보기</label></p>
  </div>
  ${includePostContent(page, site, 2).render(2)}
</article>
<p class="post-share"><a href="https://x.com/intent/post?${query}">트윗하기</a></p>
<nav class="nav">
  <p class="go-to"><a href="/lists${site.suffix}/1.html" id="list-link">쪽지/답장 목록</a></p>
  <p class="go-to"><a href="/">쪽지 보내기</a></p>
</nav>`);
};
