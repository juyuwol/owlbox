// © 2023 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { prettify } from '../util.js';

export default (site) => prettify(`\
<form id="search" class="search" action="/search${site.suffix}/" role="search">
  <input class="searchbox" name="q" type="search" aria-label="검색">
  <button type="submit">검색</button>
</form>`);
