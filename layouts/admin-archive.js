import render from './admin.js';
import { prettify } from './util.js';

export default (page, site) => {
  page.scriptsModule = ['/assets/error.js', '/assets/archive.js'];
  return render(page, site, prettify(`\
<p>데이터베이스에서 답장을 기다리는 쪽지의 목록을 내려받거나, 현재 목록에 추가할 수 있습니다.</p>
<p>(이미 답장을 한 쪽지의 경우 연결된 GitHub 리포지토리에 기록되어 있습니다.)</p>
<p><strong>내려받기</strong>: <a href="/box/unreplied" \
download="unreplied.jsonl">답장을 기다리는 쪽지 목록</a> (작성자 IP 포함)</p>
<p><strong>불러오기</strong>:</p>
<form id="import" action="/box/unreplied" method="post" data-ok="등록되었습니다.">
  <p>파일로부터 쪽지들을 데이터베이스에 추가합니다.</p>
  <p>
    <input name="file" type="file" accept=".jsonl" required="">
    <button id="import-submit" type="submit" disabled="">등록</button>
  </p>
</form>`));
};
