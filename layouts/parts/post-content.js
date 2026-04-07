// © 2023 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { escapeElement as e, escapeHTML as h, pretty } from '../util.js';

const concatSpoiler = (html, text, index) => html + (
  ((index % 2) === 0) ? h(text) :
  `<mark data-spoiler="${e(text)}" aria-label="(스포일러)"></mark>`
);

let master;

export default (post, site, level) => {
  const n = `${level}`;
  return pretty`\
<div class="post-info">
  <h${n} class="post-label">${h(post.sender, ' ')}</h${n}>
  <p class="post-date"><time class="post-sent" datetime="${
  post.sentData ?? ''}">${h(post.sentText, ' ')}</time></p>
</div>
<pre class="post-message">${
  post.censoredMessage?.reduce(concatSpoiler, '') ?? h(post.message)
}</pre>
<div class="post-info">
  <h${n} class="post-label">${master ??= h(site.master)}의 답장</h${n}>
  <p class="post-date"><time class="post-replied" datetime="${
  post.repliedData ?? ''}">${h(post.repliedText, ' ')}</time></p>
</div>
<pre class="post-reply">${
  post.censoredReply?.reduce(concatSpoiler, '') ?? h(post.reply)
}</pre>`;
};
