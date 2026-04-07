// © 2023 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import render from './admin.js';
import { colors } from './card.js';
import { prettify } from './util.js';

export default (page, site) => {
  const dot3 = '<span class="dot">.</span>'.repeat(3);
  const storable = ('KV_REST_API_URL' in process.env);
  page.scriptsModule = ['/assets/util.js', '/assets/box.js'];
  page.beforeBodyEnd = prettify(`\
<script id="box-config" type="application/json">
  ${JSON.stringify({
    offset: site.timeOffset,
    offsetMilliseconds: site.timeOffsetMilliseconds,
    perPage: site.perPage,
    postDir: `posts${site.suffix}`,
    unrepliedConfirm: '작성합니까?',
    unrepliedOK: '작성되었습니다.',
    repliedConfirm: '수정합니까?',
    repliedOK: '수정되었습니다.',
    deleteConfirm: '삭제합니까?',
    deleteOK: '삭제되었습니다.',
  })}
</script>
<template id="box-pager">
  <nav class="box-pager">
    <button class="first" type="button">맨앞</button>
    <button class="prev" type="button">이전</button>
    <span class="box-pager-status"><span class="current">1</span> / <span class="total">1</span></span>
    <button class="next" type="button">다음</button>
    <button class="last" type="button">맨끝</button>
  </nav>
</template>
<template id="box-content">
  <div>
    <p>
      <button id="box-refresh" type="button">새로 고침</button>
      <button id="box-delete" type="button" disabled="">선택 삭제</button>
    </p>
    <p id="box-status" class="box-status">총 <span id="box-total">0</span>개의 쪽지</p>
    <box-pager></box-pager>
    <div id="box-list"></div>
    <box-pager></box-pager>
  </div>
</template>
<template id="box-unreplied">
  <form class="post-item" action="/box/reply" method="post">
    <input name="id" type="hidden">
    <input name="sent" type="hidden">
    <p class="select"><label><input type="checkbox"> 선택</label></p>
    <h2 class="box-heading">
      <a class="link"><time class="sent"> </time></a>
      <select name="color">
        <option></option>${Object.keys(colors).reduce((code, name) => code + `
        <option>${name}</option>`, '')}
      </select>
    </h2>
    <img class="image onpublish" hidden="">
    <textarea class="box-message" name="message"></textarea>
    <p class="box-count"><span class="count">0</span> / 1000</p>
    <p class="box-spoiler"><label><input name="spoiler" type="checkbox"> 스포일러</label></p>
    <p class="onpublish" hidden=""><time class="replied"></time></p>
    <textarea name="reply"></textarea>
    <p class="submit"><button type="submit">작성</button></p>
  </form>
</template>
<template id="box-progress">게시 중${dot3}</template>
<template id="box-tweet"><a class="tweet" href="https://x.com/intent/post">트윗하기</a></template>
<template id="box-retry"><button class="retry" type="button">재확인</button></template>
<template id="box-replied">
  <form class="post-item" action="/box/replied" method="post">
    <input name="id" type="hidden">
    <p class="select"><label><input type="checkbox"> 선택</label></p>
    <h2 class="box-heading">
      <a class="link"><time class="sent"> </time></a>
      <span class="color"></span>
    </h2>
    <pre class="message"> </pre>
    <p><time class="replied"> </time></p>
    <pre class="reply"> </pre>
    <p class="submit"><a class="tweet" href="https://x.com/intent/post">트윗하기</a></p>
    <textarea name="reply"></textarea>
    <p class="submit"><button type="submit">수정</button></p>
  </form>
</template>`);
  return render(page, site, prettify(`\
<form id="box-tablist">
  <label class="box-tab"><input name="tab" type="radio" value="unreplied" ${
    storable ? 'checked' : 'disabled'
  }=""> 답장</label>
  <label class="box-tab"><input name="tab" type="radio" value="replied"${
    storable ? '' : ' checked=""'
  }> 수정</label>
</form>
<p id="box-loading">로드 중${dot3}</p>`));
};
