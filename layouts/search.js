import includePager from './parts/pager.js';
import includePostItem from './parts/post-item.js';
import includeSearchForm from './parts/search-form.js';
import render from './base.js';
import { pretty } from './util.js';

export default (page, site) => {
  page.title = '검색';
  page.canonical = true;
  page.notitle = true;
  page.scripts = ['/assets/search.js'];
  page.beforeBodyEnd = pretty`\
<template id="search-pager">
  ${includePager({ number: 0, totalPages: 1, first: '', prev: '', next: '', last: '' }).render(2)}
</template>
<template id="search-item">
  ${includePostItem({}, site).render(2)}
</template>
<template id="search-result">
  <div hidden="true">
    <p class="post-stats">총 <span id="search-total">0</span>개의 쪽지/답장</p>
    <search-pager></search-pager>
    <ul id="search-list" class="post-list"></ul>
    <search-pager></search-pager>
  </div>
</template>`;
  return render(page, site, pretty`\
${includeSearchForm(site)}
<search-content data-per-page="${site.perPage}" \
data-post-dir="posts${site.suffix}">
  <h2>오류 발생</h2>
  <p>애플리케이션 혹은 데이터를 불러오지 못했습니다. \
네트워크 연결 상태와 JavaScript 활성화 여부를 확인하십시오.</p>
</search-content>`);
};
