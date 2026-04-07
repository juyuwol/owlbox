// © 2023 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { escapeHTML as h, pretty } from '../util.js';
import includePostContent from './post-content.js';

export default (post, site) => pretty`\
<li class="post-item">
  <h2><a class="post-link post-title" href="${post.path ?? ''}">${h(post.title, ' ')}</a></h2>
  ${includePostContent(post, site, 3).render(2)}
</li>`;
