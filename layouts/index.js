// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import adminArchive from './admin-archive.js';
import adminBox from './admin-box.js';
import adminSettings from './admin-settings.js';
import home from './home.js';
import list from './list.js';
import message from './message.js';
import post from './post.js';
import search from './search.js';
import status from './status.js';
import { formatDateTime } from './util.js';

function formatTitle(datetime, text, sender) {
  return `${(datetime.length > 10) ? text.slice(0, -3) : text} ${sender}`;
}

function trimDateTime(datetime, length, offset) {
  return (datetime.length > length) ? (datetime.slice(0, 19) + offset) : datetime;
}

export { list as renderList, post as renderPost };

export function createPages({ posts, timeOffset, suffix, perPage }) {
  const length = 19 + timeOffset.length; // 'YYYY-mm-ddTHH:MM:SS'.length: 19
  for (const post of posts) {
    const { color = '익명의' } = post;
    const sender = post.sender = `${color} 쪽지`;
    const sent = post.sentData = trimDateTime(post.sent, length, timeOffset);
    const text = post.sentText = formatDateTime(sent);
    const replied = post.repliedData = trimDateTime(post.replied, length, timeOffset);
    post.repliedText = formatDateTime(replied);
    post.title = formatTitle(sent, text, sender);
  }

  return {
    '/': {
      layout: home,
    },
    '/assets/message.css': {
      layout: message,
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
    [`/posts${suffix}/index.txt`]: {
      layout: () => posts.reduce((a, b) => a + b.id + '\n', '') + perPage + '\n',
    },
    [`/search${suffix}/`]: {
      layout: search,
    },
    [`/search${suffix}/index.json`]: {
      layout: () => JSON.stringify(posts.map((post) => {
        const { id, message, sentData, reply, repliedData, color } = post;
        return { id, message, sent: sentData, reply, replied: repliedData, color };
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
}
