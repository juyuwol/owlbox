import site from '../config.js';
import confirm from './parts/confirm.js';
import render from './status.js';
import { DO_NOT_SEND, escapeHTML as h, formatDateTime } from './util.js';

const { baseURL } = site;
const script = '/assets/confirm.js';
const label = '보내려던 쪽지';
const details = {
  400: () => ({
    title: '400 Bad Request',
    detail: '잘못된 요청입니다.',
    scripts: [script],
    beforeBodyEnd: confirm(label),
  }),
  404: () => ({
    title: '404 Not Found',
    detail: DO_NOT_SEND,
    scripts: [script],
    beforeBodyEnd: confirm(label),
  }),
  405: () => ({
    title: '405 Method Not Allowed',
    detail: '허용되지 않는 방식의 요청입니다.',
  }),
  500: () => ({
    title: '500 Internal Server Error',
    detail: '서버에 장애가 발생해 쪽지를 보내지 못했습니다.',
    scripts: [script],
    beforeBodyEnd: confirm(label),
  }),
};

/**
 * @param {{ id: string, sent: string, message: string }} post
 * @returns {string}
 */
export function renderEmail({ id, sent, message }) {
  return `\
<p style='white-space: pre-wrap;'>${h(message)}</p>
<p>- <time datetime='${sent}'>${formatDateTime(sent)}</time> (${id})</p>
<p><a href='${baseURL}/box/'>답글 쓰기</a></p>`;
}

/**
 * @param {number} status
 * @returns {string}
 */
export function renderError(status) {
  return render(details[status](), site);
}
