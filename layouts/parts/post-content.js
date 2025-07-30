import { escapeHTML as h, pretty } from '../util.js';

let uninitialized = true;
let master = '';

export default (post, site, level) => {
  if (uninitialized) {
    master = h(site.master);
    uninitialized = false;
  }
  const heading = `h${level}`;
  return pretty`\
<div class="post-info">
  <${heading} class="post-label">익명의 쪽지</${heading}>
  <p class="post-date"><time class="post-sent" datetime="${post.sentData ?? ''}">${h(post.sentText, ' ')}</time></p>
</div>
<pre class="post-message">${h(post.message, ' ')}</pre>
<div class="post-info">
  <${heading} class="post-label">${master}의 답장</${heading}>
  <p class="post-date"><time class="post-replied" datetime="${post.repliedData ?? ''}">${h(post.repliedText, ' ')}</time></p>
</div>
<pre class="post-reply">${h(post.reply, ' ')}</pre>`;
};
