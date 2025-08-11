import render from './base.js';
import { escapeHTML as h, prettify } from './util.js';

export default (page, site) => {
  return render(page, site, prettify(`\
<h1>${h(page.title)}</h1>
<p>${h(page.detail)}</p>`));
};
