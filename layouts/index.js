import adminArchive from './admin-archive.js';
import adminBox from './admin-box.js';
import adminSettings from './admin-settings.js';
import home from './home.js';
import hooks from './hooks.js';
import list from './list.js';
import post from './post.js';
import search from './search.js';
import status from './status.js';

export { hooks, list as renderList, post as renderPost };

export const pages = {
  '/': {
    layout: home,
  },
  '/box/': {
    layout: adminBox,
  },
  '/box/archive.html': {
    layout: adminArchive,
  },
  '/box/settings.html': {
    layout: adminSettings,
  },
  '/posts/index.txt': {
    layout: (_, site) => site.posts.reduce((a, b) => a + b.id + '\n', '') + site.perPage + '\n',
  },
  '/search/': {
    layout: search,
  },
  '/search/index.json': {
    layout: (_, site) => JSON.stringify(site.posts.map((post) => {
      const { id, message, sentData: sent, reply, repliedData: replied } = post;
      return { id, message, sent, reply, replied };
    })) + '\n',
  },
  '/submit/ok.html': {
    layout: status,
    title: '전송 완료',
    detail: '쪽지를 보냈습니다.',
    confirm: '보낸 쪽지',
  },
  '/404.html': {
    layout: status,
    title: '404 Not Found',
    detail: '존재하지 않거나, 현재 사용할 수 없는 페이지입니다.',
  },
};
