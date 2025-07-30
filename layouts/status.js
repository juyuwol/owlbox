import render from './base.js';
import { escapeHTML as h, pretty } from './util.js';

export default (page, site) => {
  return render(page, site, pretty`\
<h1>${h(page.title)}</h1>
<p>${h(page.detail)}</p>`);
};
