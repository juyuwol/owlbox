import includePager from './parts/pager.js';
import includePostItem from './parts/post-item.js';
import searchForm from './snippets/search-form.js';
import render from './base.js';
import { pretty } from './util.js';

const createItems = (posts, site) => {
  const iterator = posts.values().map((post) => includePostItem(post, site));
  const items = iterator.next().value;
  for (const item of iterator) items.push(...item);
  return items;
};

export default (page, site) => {
  const { paginator } = page;
  const { totalPosts, posts } = paginator;
  const hasPager = (paginator.totalPages > 1);
  const pager = hasPager ? includePager(paginator) : '';
  if (hasPager) pager.unshift('');
  page.title = '쪽지/답장 목록';
  page.canonical = true;
  page.notitle = true;
  return render(page, site, pretty`\
${searchForm}
<p class="post-status">총 ${totalPosts}개의 쪽지/답장</p>${
(totalPosts === 0) ? '' : pretty`${
pager}
<ul class="post-list">
  ${createItems(posts, site).render(2)}
</ul>${
pager}`}`);
};
