import includePostContent from './parts/post-content.js';
import goToList from './snippets/go-to-list.js';
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
<input id="toggle-image" type="checkbox" disabled=""> 이미지 보기</label></p>
  </div>
  ${includePostContent(page, site, 2).render(2)}
</article>
<p class="post-share"><a href="https://x.com/intent/post?${query}">트윗하기</a></p>
${goToList}
<nav class="go-to nav">
  <a href="/">쪽지 보내기</a>
</nav>`);
};
