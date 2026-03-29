// Copyright 2023 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

'use strict';
((replaceChildren) => {

const { origin, pathname } = location;
const pages = new Map();
let query = normalizeQuery(new URLSearchParams(location.search));
let total = 0, perPage = 1, lastPage = 1;
let matched = null, keys = null;
let postDir = '';

let referenceElement = null;
const { classList } = document.documentElement;
const hasQuery = (query !== '');
const loading = fetch('index.json').then((res) => {
  if (!res.ok) throw new Error();
  return res.json();
});

classList.add('search-enabled');
if (hasQuery) classList.add('search-loading', 'search-searching');

customElements.define('search-content', class extends HTMLElement {
  connectedCallback() {
    const form = document.getElementById('search');
    const box = form.elements.q;

    form.onsubmit = (event) => {
      const form = event.currentTarget;
      if (form.method !== 'get') return;
      const action = new URL(form.action);
      if ((action.origin !== origin) || (action.pathname !== pathname)) return;
      event.preventDefault();
      box.value = box.value.trim();
      const params = new URLSearchParams(new FormData(form));
      action.search = params;
      history.pushState(null, '', action);
      emit('search-search', { params });
    };

    window.onpopstate = () => {
      if (location.pathname !== pathname) return;
      const params = new URLSearchParams(location.search);
      const query = box.value = normalizeQuery(params);
      emit('search-search', { params, query });
    };

    referenceElement = this.previousElementSibling;
    perPage = +this.getAttribute('data-per-page');
    postDir = this.getAttribute('data-post-dir');
    this.remove();

    if (!hasQuery) return;
    box.value = query;
    classList.remove('search-loading');
  }
});

document.addEventListener('DOMContentLoaded', () => loading.then((data) => {
  for (const post of data) {
    post.m = post.message.toLowerCase();
    post.r = post.reply.toLowerCase();
  }

  const { content } = document.getElementById('search-result');
  const totalText = content.getElementById('search-total').lastChild;
  const list = content.getElementById('search-list');
  const result = content.firstElementChild;
  const createItem = createItemCreator();

  document.addEventListener('search-render', (event) => {
    const { init, currPage } = event.detail;
    let items = pages.get(currPage);
    if (items === undefined) {
      const index = (currPage - 1) * perPage;
      items = matched.slice(index, index + perPage).map(createItem(keys));
      pages.set(currPage, items);
    }
    replaceChildren(list, items);
    if (init) return;
    totalText.data = `${total}`;
    list.hidden = (total === 0);
    result.hidden = false;
  });

  document.addEventListener('search-search', (event) => {
    const { params, query: q = normalizeQuery(params) } = event.detail;
    const init = (keys !== null) && (q === query);
    if (!init) {
      pages.clear();
      query = q;
      keys = parseKeys(q);
      if (keys === null) return void (result.hidden = true);
      matched = data.filter(({ m, r }) => keys.every(e => m.includes(e) || r.includes(e)));
      total = matched.length;
      lastPage = (total > perPage) ? Math.ceil(total / perPage) : 1;
    }
    const page = parsePage(params, lastPage);
    emit('search-render', {
      init,
      baseURL: `?${new URLSearchParams({ q })}&p=`,
      prevPage: Math.max(page - 1, 1),
      currPage: page,
      nextPage: Math.min(page + 1, lastPage),
    });
  });

  definePager(result);
  referenceElement.after(result);

  if (!hasQuery) return;
  emit('search-search', { params: new URLSearchParams(location.search) });
  classList.remove('search-searching');
}).catch(() => {
  classList.remove('search-enabled', 'search-loading', 'search-searching');
}));

function createItemCreator() {
  const template = document.getElementById('search-item').content.firstElementChild;
  const link = template.querySelector('.post-link');
  const titleText = template.querySelector('.post-title').lastChild;
  const senderText = template.querySelector('.post-label').lastChild;
  const sentTime = template.querySelector('.post-sent');
  const sentText = sentTime.lastChild;
  const repliedTime = template.querySelector('.post-replied');
  const repliedText = repliedTime.lastChild;
  return (keys) => (post) => {
    const { sent, replied, color = '익명의' } = post;
    const sender = senderText.data = `${color} 쪽지`;
    const text = sentText.data = formatDatetime(sent);
    repliedText.data = formatDatetime(replied);
    titleText.data = formatTitle(sent, text, sender);
    link.setAttribute('href', `/${postDir}/${post.id}.html`);
    sentTime.setAttribute('datetime', sent);
    repliedTime.setAttribute('datetime', replied);
    const item = template.cloneNode(true);
    highlight(keys, item.querySelector('.post-message'), post.message, post.m);
    highlight(keys, item.querySelector('.post-reply'), post.reply, post.r);
    return item;
  };
}

function definePager(result) {
  function intercept(event) {
    const link = event.currentTarget;
    if ((link.origin !== origin) || (link.pathname !== pathname)) return;
    event.preventDefault();
    history.pushState(null, '', link.href);
    emit('search-search', { params: new URLSearchParams(link.search) });
    result.setAttribute('tabindex', '-1');
    result.focus({ preventScroll: true });
    result.blur();
    result.removeAttribute('tabindex');
    const y = result.getBoundingClientRect().y - 8;
    if (y < 0) window.scrollBy(0, y);
  }

  const pager = document.getElementById('search-pager').content.firstElementChild;
  customElements.define('search-pager', class extends HTMLElement {
    constructor() {
      super();
      this.append(pager.cloneNode(true));

      const firstLink = this.querySelector('.pager-first > a');
      const firstItem = firstLink.parentNode;
      const prevLink = this.querySelector('.pager-prev > a');
      const prevItem = prevLink.parentNode;
      const nextLink = this.querySelector('.pager-next > a');
      const nextItem = nextLink.parentNode;
      const lastLink = this.querySelector('.pager-last > a');
      const lastItem = lastLink.parentNode;
      const currText = this.querySelector('.pager-curr').lastChild;

      lastLink.onclick = nextLink.onclick = prevLink.onclick = firstLink.onclick = intercept;

      document.addEventListener('search-render', (event) => {
        if (this.hidden = (total === 0)) return;
        const { init, baseURL, prevPage, currPage, nextPage } = event.detail;
        prevItem.hidden = firstItem.hidden = (currPage === 1);
        lastItem.hidden = nextItem.hidden = (currPage === lastPage);
        currText.data = `${currPage}`;
        prevLink.setAttribute('href', baseURL + prevPage);
        nextLink.setAttribute('href', baseURL + nextPage);
        if (init) return;
        firstLink.setAttribute('href', baseURL + '1');
        lastLink.setAttribute('href', baseURL + lastPage);
      });
    }
  });
}

function emit(type, detail) {
  document.dispatchEvent(new CustomEvent(type, { detail }));
}

function formatDatetime(datetime) {
  const month = +datetime.slice(5, 7);
  const day = +datetime.slice(8, 10);
  const date = `${datetime.slice(0, 4)}. ${month}. ${day}.`;
  return (datetime.length > 10) ? `${date} ${datetime.slice(11, 19)}` : date;
}

function formatTitle(datetime, text, sender) {
  return `${(datetime.length > 10) ? text.slice(0, -3) : text} ${sender}`;
}

function highlight(keys, parent, str, strLowered) {
  const indexes = new Map();
  const end = str.length;
  keys = new Set(keys);
  for (let i = 0, k = 0, n = -1; i < end; n = -1) {
    for (const key of keys) {
      const cache = indexes.get(key);
      const index = (cache >= i) ? cache : strLowered.indexOf(key, i);
      if (index === -1) {
        keys.delete(key);
        continue;
      } else if ((n === -1) || (n > index)) {
        n = index;
        k = key.length;
      }
      indexes.set(key, index);
    }
    if (n === -1) {
      if (i < end) parent.append(str.slice(i));
      break;
    }
    if (i < n) parent.append(str.slice(i, n));
    const mark = document.createElement('mark');
    mark.append(str.slice(n, i = n + k));
    parent.append(mark);
  }
}

function normalizeQuery(params) {
  const query = params.get('q');
  return (query === null) ? '' : query.trim();
}

function compare(a, b) {
  const diff = b.length - a.length;
  return (diff !== 0) ? diff : (a < b) ? -1 : 1;
}

function parseKeys(query) {
  if (query === '') return null;
  const keys = new Set();
  const end = query.length;
  for (let i = 0, k = 0, n = 0; i < end; i = n + 1) {
    k = query.indexOf('"', i);
    const unfound = (k === -1) || ((n = query.indexOf('"', k + 1)) === -1);
    if (unfound || (i < k)) {
      for (const e of query.slice(i, unfound ? end : k).trim().split(' ')) {
        if (e === '') continue;
        keys.add(e.toLowerCase());
      }
      if (unfound) break;
    }
    if (++k < n) keys.add(query.slice(k, n).toLowerCase());
  }
  return (keys.size > 0) ? [...keys].sort(compare) : null;
}

function parsePage(params, size) {
  const query = params.get('p');
  if (!query) return 1;
  const number = +query;
  if (!Number.isFinite(number) || (number <= 1)) return 1;
  return Math.min(Math.trunc(number), size);
}

})(('replaceChildren' in document) ?
  (parent, children) => parent.replaceChildren(...children) :
  (parent, children) => {
    while (parent.hasChildNodes()) parent.removeChild(parent.lastChild);
    parent.append(...children);
  }
);
