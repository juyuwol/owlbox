// Copyright 2023 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import render from './base.js';
import { colors } from './card.js';
import { DO_NOT_SEND, escapeHTML as h, prettify, pretty } from './util.js';

export default (page, site) => {
  const activated = site.activated && ('KV_REST_API_URL' in process.env);
  const maxLength = `${site.maxLength}`;
  const description = `<p>${h(site.description)}</p>`;
  const heading = `<h2>${page.title = '쪽지 보내기'}</h2>`;
  page.canonical = true;
  page.notitle = true;
  page.styles = ['/assets/message.css'];
  if (activated) page.scripts = ['/assets/message.js'];
  return render(page, site, pretty`${prettify(activated ? `\
<form id="message" action="/submit" method="post">
  ${heading}
  ${description}
  <textarea name="message" required="" maxlength="${maxLength}" \
aria-label="쪽지 내용"></textarea>
  <p class="message-line message-count">\
<span id="message-count">0</span> / ${maxLength}</p>
  <p class="message-line"><label><input name="spoiler" \
type="checkbox" aria-describedby="spoiler-description"> 스포일러</label><br>
  <span id="spoiler-description" hidden="">\
\`와 \`로 문자를 둘러싸면 섬네일 이미지 및 목록에서 ○로 표시됩니다.</span></p>
  <details id="message-color" class="message-line message-color">
    <summary class="message-toggle"><span class="label">테두리 색\
<span id="color-icon" class="color-icon"></span></span></summary>
    <p class="message-line">섬네일용 이미지의 테두리 색을 설정할 수 있습니다. \
선택·변경·중복 자유.</p>
    <p class="message-line"><label>\
<input name="color" type="radio" value="" checked=""> 설정하지 않음</label></p>
    <p class="message-line">${Object.keys(colors).reduce((str, name) => str + `
      <label class="color-label">\
<input name="color" type="radio" value="${name}">\
<span class="color-icon" data-color="${name}"></span> ${name}</label>`, '')}
    </p>
    <p class="message-line color-remember"><label>\
<input id="color-remember" type="checkbox"> 설정 저장</label></p>
  </details>
  <message-init hidden=""></message-init>
  <p class="message-line">여러 사람의 말이 섞이거나 대화가 여러 차례 오갈 때를 \
대비해, 되도록 테두리 색을 설정해 주세요.</p>
  <p class="message-submit"><button type="submit">전송</button></p>
</form>` : `\
${heading}
${description}
<p><strong>${h(DO_NOT_SEND)}</strong></p>`)}
<nav class="nav">
  <p class="go-to"><a href="/lists${site.suffix}/1.html">쪽지/답장 목록</a></p>
</nav>
<h2>이곳에 대해</h2>
${prettify(site.about)}
<p>이 사이트는 <a href="${site.generator.repository}">부엉이 사서함</a> \
프로젝트의 소스 코드를 이용해 제작되었습니다.</p>`);
};
