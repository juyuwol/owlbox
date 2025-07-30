'use strict';

((state = {}) => {

const { classList } = document.documentElement;
const { origin, pathname } = location;
const params = new URLSearchParams(location.search);
const query = normalizeQuery(params);
const keys = parseKeys(query);
const hasKeys = (keys !== null);
const loading = fetch('/search/index.json').then((res) => {
  if (!res.ok) throw new Error();
  return res.json();
});

classList.add('search-enabled');
if (hasKeys) classList.add('search-busy');

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('search');
  const button = form.querySelector('[type=submit]');
  if (hasKeys) {
    form.elements.q.value = query;
    button.disabled = true;
    classList.add('search-busy2');
    classList.remove('search-busy');
  }

  try {
    const data = await loading;
    const { content } = document.getElementById('search-result');
    const totalText = content.getElementById('search-total').lastChild;
    const list = content.getElementById('search-list');
    const result = content.firstElementChild;
    const perPage = +result.dataset.perPage;
    const createItem = createItemCreator();

    document.addEventListener('search-render', (event) => {
      const { matched, page, pages } = event.detail;
      const total = matched.length;
      const cache = pages.get(page);
      if (cache !== undefined) {
        list.replaceChildren(...cache);
      } else {
        const index = (page - 1) * perPage;
        const items = matched.slice(index, index + perPage).map(createItem);
        pages.set(page, items);
        list.replaceChildren(...items);
      }
      totalText.data = `${total}`;
      list.hidden = (total === 0);
      result.hidden = false;
    });

    document.addEventListener('search-search', (event) => {
      const { params, query = normalizeQuery(params) } = event.detail;
      if (query === state.query) {
        state.page = parsePage(params, state.size);
      } else {
        const keys = parseKeys(query);
        if (keys === null) return void (result.hidden = true);
        const matched = data.filter(search(keys));
        const total = matched.length;
        const size = (total > 1) ? Math.ceil(total / perPage) : 1;
        const page = parsePage(params, size);
        state = { query, size, matched, page, pages: new Map() };
      }
      emit('search-render', state);
    });

    window.onpopstate = () => {
      if (location.pathname !== pathname) return;
      emit('search-search', { params: new URLSearchParams(location.search) });
    };

    form.onsubmit = (event) => {
      const form = event.currentTarget;
      if (form.method !== 'get') return;
      const action = new URL(form.action);
      if ((action.origin !== origin) || (action.pathname !== pathname)) return;
      event.preventDefault();
      const params = new URLSearchParams(new FormData(form));
      action.search = params;
      history.pushState(null, '', action);
      emit('search-search', { params });
    };

    definePager(result);
    document.getElementById('search-error').replaceWith(result);

    if (!hasKeys) return;
    button.disabled = false;
    emit('search-search', { params, query });
    classList.remove('search-busy2');
  } catch (e) {
    classList.remove('search-enabled', 'search-busy', 'search-busy2');
  }
});

function createItemCreator() {
  const template = document.getElementById('search-item').content.firstElementChild;
  const link = template.querySelector('.post-link');
  const titleText = template.querySelector('.post-title').lastChild;
  const messageText = template.querySelector('.post-message').lastChild;
  const sentTime = template.querySelector('.post-sent');
  const sentText = sentTime.lastChild;
  const replyTime = template.querySelector('.post-reply');
  const replyText = replyTime.lastChild;
  const repliedText = template.querySelector('.post-replied').lastChild;
  return ({ id, message, sent, reply, replied }) => {
    link.href = `/posts/${id}.html`;
    titleText.data = formatTitle(sent);
    messageText.data = message;
    sentText.data = formatDatetime(sent);
    replyText.data = reply;
    repliedText.data = formatDatetime(replied);
    sentTime.setAttribute('datetime', sent);
    replyTime.setAttribute('datetime', replied);
    return template.cloneNode(true);
  };
}

function definePager(result) {
  function intercept(event) {
    const link = event.currentTarget;
    if ((link.origin !== origin) || (link.pathname !== pathname)) return;
    event.preventDefault();
    history.pushState(null, '', link.href);
    const params = new URLSearchParams(link.search);
    const query = normalizeQuery(params);
    if (query === state.query) {
      state.page = parsePage(params, state.size);
      emit('search-render', state);
    } else {
      emit('search-search', { params, query });
    }
    result.setAttribute('tabindex', '-1');
    result.focus({ preventScroll: true });
    result.blur();
    result.removeAttribute('tabindex');
    const y = result.getBoundingClientRect().y - 8;
    if (y < 0) window.scrollBy(0, y);
  }

  const template = document.getElementById('search-pager').content.firstElementChild;
  customElements.define('search-pager', class extends HTMLElement {
    constructor() {
      super();
      this.append(template.cloneNode(true));

      const first = this.querySelector('.pager-first > a');
      const prev = this.querySelector('.pager-prev > a');
      const next = this.querySelector('.pager-next > a');
      const last = this.querySelector('.pager-last > a');
      const curr = this.querySelector('.pager-curr').lastChild;
      last.onclick = next.onclick = prev.onclick = first.onclick = intercept;

      document.addEventListener('search-render', (event) => {
        const { query, size, matched, page } = event.detail;
        const path = `?${new URLSearchParams({ q: query })}&p=`;
        this.hidden = (matched.length === 0);
        prev.parentNode.hidden = first.parentNode.hidden = (page === 1);
        last.parentNode.hidden = next.parentNode.hidden = (page === size);
        curr.data = `${page}`;
        first.href = path + '1';
        prev.href = path + Math.max(page - 1, 1);
        next.href = path + Math.min(page + 1, size);
        last.href = path + size;
      });
    }
  });
}

function emit(type, detail) {
  document.dispatchEvent(new CustomEvent(type, { detail }));
}

function normalizeQuery(params) {
  const query = params.get('q');
  return (query === null) ? '' : query.trim();
}

function parseKeys(query) {
  if (query === '') return null;
  const keys = new Set();
  const end = query.length;
  for (let i = 0, k = 0, p = 0; p < end; p = k + 1) {
    i = query.indexOf('"', p);
    const unfound = (i === -1) || ((k = query.indexOf('"', i + 1)) === -1);
    if (unfound || (p < i)) {
      for (const e of query.slice(p, unfound ? end : i).trim().split(' ')) {
        if (e === '') continue;
        keys.add(e.toLowerCase());
      }
      if (unfound) break;
    }
    if (++i < k) keys.add(query.slice(i, k).toLowerCase());
  }
  return (keys.size === 0) ? null : [...keys];
}

function parsePage(params, size) {
  const query = params.get('p');
  if ((query === null) || (query === '')) return 1;
  const number = +query;
  if (!Number.isFinite(number) || (number <= 1)) return 1;
  return Math.min(Math.trunc(number), size);
}

function search(keys) {
  return ({ message, reply }) => {
    message = message.toLowerCase();
    reply = reply.toLowerCase();
    return keys.every(e => (message.includes(e) || reply.includes(e)));
  };
}

function formatDatetime(datetime) {
  const month = +datetime.slice(5, 7);
  const day = +datetime.slice(8, 10);
  const date = `${datetime.slice(0, 4)}. ${month}. ${day}.`;
  if (datetime.length === 10) return date;
  return `${date} ${datetime.slice(11, 19)}`;
}

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

})();
