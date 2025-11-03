import includePager from './parts/pager.js';
import includePostItem from './parts/post-item.js';
import includeSearchForm from './parts/search-form.js';
import render from './base.js';
import { pretty } from './util.js';

const concat = (a, b) => (a.push(...b), a);

export default (page, site) => {
  const { paginator } = page;
  const { posts, totalPosts } = paginator;
  const hasPager = (paginator.totalPages > 1);
  const pager = hasPager ? includePager(paginator) : '';
  if (hasPager) pager.unshift('');
  page.title = '쪽지/답장 목록';
  page.canonical = true;
  page.notitle = true;
  return render(page, site, pretty`\
${includeSearchForm(site)}
<p class="post-status">총 ${totalPosts}개의 쪽지/답장</p>${
(totalPosts === 0) ? '' : pretty`${
pager}
<ul class="post-list">
  ${posts.values().map(e => includePostItem(e, site)).reduce(concat).render(2)}
</ul>${
pager}`}`);
};
