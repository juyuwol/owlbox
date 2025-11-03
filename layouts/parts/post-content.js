import { escapeHTML as h, pretty } from '../util.js';

let master;

export default (post, site, level) => {
  const n = `${level}`;
  return pretty`\
<div class="post-info">
  <h${n} class="post-label">${h(post.sender, ' ')}</h${n}>
  <p class="post-date"><time class="post-sent" datetime="${
  post.sentData ?? ''}">${h(post.sentText, ' ')}</time></p>
</div>
<pre class="post-message">${h(post.message)}</pre>
<div class="post-info">
  <h${n} class="post-label">${master ??= h(site.master)}의 답장</h${n}>
  <p class="post-date"><time class="post-replied" datetime="${
  post.repliedData ?? ''}">${h(post.repliedText, ' ')}</time></p>
</div>
<pre class="post-reply">${h(post.reply)}</pre>`;
};
