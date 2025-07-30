import { formatDateTime } from './util.js';

function formatTitle(datetime) {
  const month = +datetime.slice(5, 7);
  const day = +datetime.slice(8, 10);
  let title = `${datetime.slice(0, 4)}년 ${month}월 ${day}일`;
  if (datetime.length > 10) {
    const hours = +datetime.slice(11, 13);
    const hours12 = hours % 12;
    const minutes = +datetime.slice(14, 16);
    const suffix = (hours < 12) ? '전' : '후';
    title += ` 오${suffix} ${(hours12 === 0) ? '12' : hours12}시 ${minutes}분`;
  }
  return `${title}의 쪽지`;
}

function trimDateTime(datetime, length, offset) {
  return (datetime.length > length) ? (datetime.slice(0, 19) + offset) : datetime;
}

export default {
  prerender: (site) => {
    const offset = site.timeOffset;
    const length = 19 + offset.length; // 'YYYY-mm-ddTHH:MM:SS'.length: 19
    for (const post of site.posts) {
      const sent = post.sentData = trimDateTime(post.sent, length, offset);
      const replied = post.repliedData = trimDateTime(post.replied, length, offset);
      post.sentText = formatDateTime(sent);
      post.repliedText = formatDateTime(replied);
      post.title = formatTitle(sent);
    }
  },
};
