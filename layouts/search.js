// © 2023 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import includePager from './parts/pager.js';
import includePostItem from './parts/post-item.js';
import includeSearchForm from './parts/search-form.js';
import render from './base.js';
import { pretty } from './util.js';

export default (page, site) => {
  const { perPage, suffix } = site;
  page.title = '검색';
  page.canonical = true;
  page.notitle = true;
  page.scripts = ['/assets/search.js'];
  page.beforeBodyEnd = pretty`\
<template id="search-pager">
  ${includePager({ number: ' ', first: '', prev: '', next: '', last: '' }).render(2)}
</template>
<template id="search-result">
  <p class="post-status">총 <span id="search-total">0</span>개의 쪽지/답장</p>
  <search-pager></search-pager>
  <ul id="search-list" class="post-list">
    ${includePostItem({}, site).render(4)}
  </ul>
  <search-pager></search-pager>
</template>`;
  return render(page, site, pretty`\
<div class="search-header">
  ${includeSearchForm(site).render(2)}
  <nav class="search-back nav"><a href="/lists${suffix}/1.html">목록</a></nav>
</div>
<search-init data-per-page="${perPage}" data-post-dir="posts${suffix}">
  <h2>오류 발생</h2>
  <p>애플리케이션 혹은 데이터를 불러오지 못했습니다. \
네트워크 연결 상태와 JavaScript 활성화 여부를 확인하십시오.</p>
</search-init>`);
};
