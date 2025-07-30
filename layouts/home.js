import goToList from './snippets/go-to-list.js';
import render from './base.js';
import { DO_NOT_SEND, escapeHTML as h, pretty } from './util.js';

export default (page, site) => {
  const activated = site.activated && ('KV_REST_API_URL' in process.env);
  const maxLength = `${site.maxLength}`;
  const description = `<p>${h(site.description)}</p>`;
  const heading = `<h2>${page.title = '쪽지 보내기'}</h2>`;
  page.canonical = true;
  page.notitle = true;
  if (activated) page.scripts = ['/assets/form.js'];
  return render(page, site, pretty`${
activated ? pretty`\
<form id="message-form" action="/submit" method="post">
  ${heading}
  ${description}
  <textarea name="message" required="" maxlength="${maxLength}"></textarea>
  <p class="message-count"><span id="message-count">0</span> / ${maxLength}</p>
  <p class="message-submit-bar"><button id="message-submit" type="submit">전송</button></p>
</form>` : pretty`\
${heading}
${description}
<p><strong>${h(DO_NOT_SEND)}</strong></p>`}
${goToList}
<h2>이곳에 대해</h2>
${pretty([site.about])}
<p>이 사이트는 <a href="${site.generator.repository}">부엉이 사서함</a> \
프로젝트의 소스 코드를 이용해 제작되었습니다.</p>`);
};
