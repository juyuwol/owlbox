import render from './admin.js';
import { pretty } from './util.js';

export default (page, site) => {
  const checkbox = '<p><label class="label-checkbox"><input type="checkbox"> 선택</label></p>';
  const dot3 = '<span class="dot">.</span>'.repeat(3);
  const storable = ('KV_REST_API_URL' in process.env);
  page.scriptsModule = ['/assets/error.js', '/assets/box.js'];
  page.beforeBodyEnd = pretty`\
<script id="box-config" type="application/json">${JSON.stringify({
  perPage: site.perPage,
  offset: site.timeOffset,
  offsetMilliseconds: site.timeOffsetMilliseconds,
  unrepliedConfirm: '작성합니까?',
  unrepliedOK: '작성되었습니다.',
  repliedConfirm: '수정합니까?',
  repliedOK: '수정되었습니다.',
  deleteConfirm: '삭제합니까?',
  deleteOK: '삭제되었습니다.',
})}</script>
<template id="box-pager">
  <nav class="box-pager">
    <button class="box-pager-first" type="button">맨앞</button>
    <button class="box-pager-prev" type="button">이전</button>
    <span class="box-pager-status">
      <span class="box-pager-curr">1</span> / <span class="box-pager-size">1</span>
    </span>
    <button class="box-pager-next" type="button">다음</button>
    <button class="box-pager-last" type="button">맨끝</button>
  </nav>
</template>
<template id="box-content">
  <div>
    <p>
      <button id="refresh" type="button">새로 고침</button>
      <button id="delete" type="button" disabled="">선택 삭제</button>
    </p>
    <p id="box-status" class="box-status">총 <span id="box-total">0</span>개의 쪽지</p>
    <box-pager></box-pager>
    <div id="box-list"></div>
    <box-pager></box-pager>
  </div>
</template>
<template id="box-checkbox">${checkbox}</template>
<template id="box-published">
  <div class="post-item">
    <p class="box-post-heading"><a class="sent link"> </a></p>
    <img class="image">
    <pre class="message"> </pre>
    <p class="replied"> </p>
    <pre class="reply"> </pre>
    <p class="box-submit loading">게시 중${dot3}</p>
  </div>
</template>
<template id="box-published-tweet">
  <p class="box-submit"><a class="tweet" href="https://x.com/intent/post">트윗하기</a></p>
</template>
<template id="box-published-retry">
  <p class="box-submit">\
<button class="retry" type="button" aria-describedby="retry-description">재확인</button><br>
  <span id="retry-description" class="admin-description">\
여러 번 재확인을 시도해도 페이지가 게시되지 않는다면 서버 장애가 원인일 수 있습니다. \
<a href="https://vercel.com/dashboard">Vercel 대시보드</a>에서 상태를 확인하세요.\
</span></p>
</template>
<template id="box-unreplied">
  <form class="post-item" action="/box/reply" method="post">
    <input name="id" type="hidden">
    <input name="sent" type="hidden">
    <box-checkbox></box-checkbox>
    <p class="sent"> </p>
    <p class="box-message"><textarea name="message"></textarea></p>
    <p class="box-count"><span class="count"> </span> / 1000</p>
    <p><textarea name="reply"></textarea></p>
    <p class="box-submit"><button type="submit">작성</button></p>
  </form>
</template>
<template id="box-replied">
  <form class="post-item" action="/box/modify" method="post">
    <input name="id" type="hidden">
    <box-checkbox></box-checkbox>
    <h2 class="box-post-heading"><a class="sent"> </a></h2>
    <pre class="message"> </pre>
    <p class="replied"> </p>
    <pre class="reply"> </pre>
    <p><textarea name="reply"></textarea></p>
    <p class="box-submit"><button type="submit">수정</button></p>
  </form>
</template>
<template id="box-selected">
  <div class="post-item">
    ${checkbox}
    <p class="sent"> </p>
    <pre class="message"> </pre>
    <p class="replied"> </p>
    <pre class="reply"> </pre>
  </div>
</template>`;
  return render(page, site, pretty`\
<form id="tab" class="box-tabs">
  <label class="box-tab label-checkbox">\
<input name="tab" type="radio" value="unreplied" ${
storable ? 'checked' : 'disabled'}=""> 답장</label>
  <label class="box-tab label-checkbox">\
<input name="tab" type="radio" value="replied"${
storable ? '' : ' checked=""'}> 수정</label>
</form>
<p id="box-loading">로드 중${dot3}</p>`);
};
