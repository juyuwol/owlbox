// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import render from './admin.js';
import { escapeElement as e, escapeHTML as h, prettify } from './util.js';

export default (page, site) => {
  const { env } = process;
  const { email, preferredSender } = site;
  const availableGoogle = ('APPS_SCRIPT_URL' in env);
  const availableResend = ('RESEND_API_KEY' in env) && ('RESEND_DOMAIN' in env);
  const sendable = (availableGoogle || availableResend) && (typeof email === 'string');
  const storable = ('KV_REST_API_URL' in env);
  page.scriptsModule = ['/assets/util.js', '/assets/settings.js'];
  return render(page, site, prettify(`\
<form id="settings" action="/box/config" method="post" autocomplete="off" \
data-ok="설정을 변경했습니다. 적용되기까지 다소 시간이 걸릴 수 있습니다.">
  <ul class="settings-list">
    <li class="settings-item"><label><input name="activated" type="checkbox"${
      (site.activated === true) ? ' checked=""' : ''
    } aria-describedby="activated-description"> 쪽지 받기</label><br>
    <span id="activated-description" class="admin-description">${storable ? '\
비활성화해도 기존의 쪽지/답장은 비공개되지 않으며, \
이미 받은 쪽지에 답장하거나 기존 답장을 수정할 수 있습니다.' : '\
프로젝트에 Upstash for Redis를 연동하지 않으면, \
활성 상태로 설정해도 무시됩니다.'}</span></li>
    <li class="settings-item"><label><input name="notify" type="checkbox"${
      (site.notify === true) ? ' checked=""' : ''
    }${sendable ? '' : ' aria-describedby="notify-description"'
    }> 이메일 알림 받기</label>${sendable ? '' : `<br>
    <span id="notify-description" class="admin-description">\
프로젝트에 이메일 발송을 위한 환경 변수를 설정하지 않거나, \
이메일 주소를 설정하지 않으면, 활성 상태로 설정해도 무시됩니다.</span>`}</li>
    <li class="settings-item"><label class="settings-label">\
이메일 주소: <input class="settings-input" name="email" type="email" \
value="${e(email)}" aria-describedby="email-description"></label><br>
    <span id="email-description" class="admin-description">\
이 주소로 이메일 알림을 받습니다.</span></li>
    <li class="settings-item"><label class="settings-label">\
사서함 이름: <input class="settings-input" name="title" type="text" \
value="${e(site.title)}" required="" pattern="\\s*\\S.*" \
aria-describedby="title-description"></label><br>
    <span id="title-description" class="admin-description">\
이메일 알림의 보내는 이름으로도 사용됩니다.</span></li>
    <li class="settings-item"><label class="settings-label">\
쪽지의 최대 글자 수: <input class="settings-input" name="maxLength" \
type="number" value="${site.maxLength
}" required="" min="1" max="1000">\
</label></li>
    <li class="settings-item"><label class="settings-label">\
목록의 최대 표시 수: <input class="settings-input" name="perPage" \
type="number" value="${site.perPage
}" required="" min="1" max="32767">\
</label></li>
    <li class="settings-item"><label class="settings-label">\
기준 시간대: <input class="settings-input" name="timeOffset" type="text" \
value="${site.timeOffset}" required="" \
pattern="(?:[+\\-](?:[01]\\d|2[0-3]):[0-5]\\d)|Z" \
aria-describedby="time-offset-description"></label><br>
    <span id="time-offset-description" class="admin-description">\
<a href="https://datatracker.ietf.org/doc/html/rfc3339#section-5.6">\
RFC 3339 time-offset</a> 형식으로, +/- 부호가 붙은 HH:MM 형식의 시간, \
혹은 단일 문자 Z여야 합니다. 예) UTC+9의 대한민국 시간대: +09:00</span></li>
    <li class="settings-item"><label class="settings-label">\
사서함 설명: <input class="settings-input" name="description" type="text" \
value="${e(site.description)}" aria-describedby="description-description">\
</label><br>
    <span id="description-description" class="admin-description">\
쪽지 작성란 바로 위에 위치한 소개문이 됩니다.</span></li>
    <li class="settings-item"><label class="settings-label">\
운영자 이름: <input class="settings-input" name="master" type="text" \
value="${e(site.master)}" aria-describedby="master-description"></label><br>
    <span id="master-description" class="admin-description">\
각 쪽지/답장에서 '○○의 답장'으로 표시됩니다.</span></li>
    <li class="settings-item"><label class="settings-label">\
하단 링크 문구: <input class="settings-input" name="footerLabel" type="text" \
value="${e(site.footerLabel)}" aria-describedby="footer-label-description">\
</label><br>
    <span id="footer-label-description" class="admin-description">\
모든 페이지 하단(푸터)에 위치한 링크의 내용이 됩니다.</span></li>
    <li class="settings-item"><label class="settings-label">\
하단 링크 주소: <input class="settings-input" name="footerURL" type="text" \
value="${e(site.footerURL)}" aria-describedby="footer-url-description">\
</label><br>
    <span id="footer-url-description" class="admin-description">\
모든 페이지 하단(푸터)에 위치한 링크의 URL이 됩니다.</span></li>
    <li class="settings-item"><label class="settings-label">\
소개문: <textarea class="settings-textarea" name="about" aria-\
describedby="about-description">${h(site.about)}</textarea></label><br>
    <span id="about-description" class="admin-description">\
메인 페이지 ‘이곳에 대해’ 소제목 아래의 상세 소개문입니다. (HTML)</span></li>
    <li class="settings-item"><label>\
<input name="showLogin" type="checkbox"${
  (site.showLogin === true) ? ' checked=""' : ''
} aria-describedby="show-login-description"> \
로그인 메뉴 보이기</label><br>
    <span id="show-login-description" class="admin-description">\
상단 메뉴(헤더)에 관리 패널로 이동하는 링크를 노출시킵니다. \
비활성화 시, 그 자리에 다크/라이트 테마 전환 토글이 들어갑니다.</span></li>
    <li>선호 이메일 발송자:<br>
    <label><input name="preferredSender" type="radio" value="google"${
      (preferredSender === 'google') ? ' checked=""' : ''
    } aria-describedby="preferred-sender-description"> Google Apps Script</label><br>
    <label><input name="preferredSender" type="radio" value="resend"${
      (preferredSender === 'resend') ? ' checked=""' : ''
    } aria-describedby="preferred-sender-description"> Resend</label><br>
    <span id="preferred-sender-description" class="admin-description">\
이메일 발송을 위한 환경 변수가 여러 종류 설정되어 있을 때 \
우선하여 사용할 발송자를 선택합니다.</span></li>
  </ul>
  <p class="submit"><button type="submit" disabled="">변경</button></p>
</form>`));
};
