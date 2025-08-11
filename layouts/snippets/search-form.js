import { prettify } from '../util.js';

export default prettify(`\
<form id="search" class="search" action="/search/" role="search">
  <input class="searchbox" name="q" type="search" aria-label="검색">
  <button type="submit">검색</button>
</form>`);
