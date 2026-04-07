// © 2023 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { prettify } from '../util.js';

export default ({ number, first, prev, next, last, totalPages }) => prettify(`\
<nav class="pager">
  <ul class="pager-list nav">${(number === 1) ? `
    <li class="pager-item first" hidden="">맨앞</li>
    <li class="pager-item prev" hidden="">이전</li>` : `
    <li class="pager-item"><a href="${first}" class="first">맨앞</a></li>
    <li class="pager-item"><a href="${prev}" class="prev">이전</a></li>`}
    <li class="pager-item current">${number}</li>${(number === totalPages) ? `
    <li class="pager-item next" hidden="">다음</li>
    <li class="pager-item last" hidden="">맨끝</li>` : `
    <li class="pager-item"><a href="${next}" class="next">다음</a></li>
    <li class="pager-item"><a href="${last}" class="last">맨끝</a></li>`}
  </ul>
</nav>`);
