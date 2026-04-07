// © 2023 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import includePostContent from './parts/post-content.js';
import render from './base.js';
import { escapeHTML as h, prettify, pretty } from './util.js';

const concatSpoiler = (a, b, i) => a + ((i % 2) ? '(스포일러)' : b);

const scriptsModule = ['/assets/post.js'];

export default (page, site) => {
  const { censoredReply } = page;
  const reply = censoredReply?.reduce(concatSpoiler) ?? page.reply;
  const query = new URLSearchParams({ text: `${reply} ${page.permalink}` });
  page.canonical = true;
  page.scriptsModule = scriptsModule;
  return render(page, site, pretty`\
<article>
  <div class="post-header">
    <h1 class="post-title">${h(page.title)}</h1>
    <form id="post-setting" class="post-setting">보기:${prettify(censoredReply ? `
      <label><input type="radio" name="view" value="censored" checked=""> 검열문</label>
      <label><input type="radio" name="view" value="origin"> 원문</label>` : `
      <label><input type="radio" name="view" value="origin" checked=""> 원문</label>`)}
      <label><input type="radio" name="view" value="image"> 이미지</label>
    </form>
  </div>
  ${includePostContent(page, site, 2).render(2)}
</article>
<p class="post-share"><a href="https://x.com/intent/post?${query}">트윗하기</a></p>
<nav class="nav">
  <p class="go-to"><a href="/lists${site.suffix}/1.html" id="list-link">쪽지/답장 목록</a></p>
  <p class="go-to"><a href="/">쪽지 보내기</a></p>
</nav>`);
};
