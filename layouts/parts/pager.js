import { prettify } from '../util.js';

export default ({ number, totalPages, first, prev, next, last }) => {
  const onFirst = (number === 1);
  const onLast = (number === totalPages);
  return prettify(`\
<nav class="pager">
  <ul class="pager-list nav">
    <li class="pager-item pager-first"${onFirst ?
      ' hidden="">&lt;&lt; <span class="pager-label">맨앞</span>' :
      `><a href="${first}"><span aria-hidden="true">&lt;&lt;</span> \
<span class="pager-label">맨앞</span></a>`
    }</li>
    <li class="pager-item pager-prev"${onFirst ?
      ' hidden="">&lt; <span class="pager-label">이전</span>' :
      `><a href="${prev}"><span aria-hidden="true">&lt;</span> \
<span class="pager-label">이전</span></a>`
    }</li>
    <li class="pager-item pager-curr">${number}</li>
    <li class="pager-item pager-next"${onLast ?
      ' hidden=""><span class="pager-label">다음</span> &gt;' :
      `><a href="${next}"><span class="pager-label">다음</span> \
<span aria-hidden="true">&gt;</span></a>`
    }</li>
    <li class="pager-item pager-last"${onLast ?
      ' hidden=""><span class="pager-label">맨끝</span> &gt;&gt;' :
      `><a href="${last}"><span class="pager-label">맨끝</span> \
<span aria-hidden="true">&gt;&gt;</span></a>`
    }</li>
  </ul>
</nav>`);
};
