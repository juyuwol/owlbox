// Copyright 2023 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

'use strict';
(() => {

if (!Element.prototype.replaceChildren) {
  Element.prototype.replaceChildren = function () {
    while (this.hasChildNodes()) this.lastChild.remove();
    this.append(...arguments);
  };
}

const { classList } = document.documentElement;
const { origin, pathname } = location;
const pages = new Map();
const loading = fetch('index.json').then((res) => {
  if (!res.ok) throw new Error();
  return res.json();
});

let query = normalizeQuery(new URLSearchParams(location.search));
let matched = null, keys = null;
let total = 0, lastPage = 1;

const hasInitQuery = (query !== '');
if (hasInitQuery) {
  classList.add('search-rendering', 'search-loading');
}

customElements.define('search-init', class extends HTMLElement {
  connectedCallback() {
    const perPage = +this.getAttribute('data-per-page');
    const postDir = this.getAttribute('data-post-dir');

    const form = document.getElementById('search');
    const box = form.elements.q;
    const container = document.createElement('div');
    container.hidden = true;

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
    
    if (hasInitQuery) {
      box.value = query;
      classList.remove('search-rendering');
    }

    this.replaceWith(container);

    document.addEventListener('DOMContentLoaded', () => loading.then((posts) => {
      for (const post of posts) {
        let { message, reply } = post;
        if (post.spoiler) {
          message = message.replaceAll('`', '');
          reply = reply.replaceAll('`', '');
        }
        post.m = message.toLowerCase();
        post.r = reply.toLowerCase();
      }

      const { content } = document.getElementById('search-result');
      const totalText = content.getElementById('search-total').lastChild;
      const list = content.getElementById('search-list');
      const item = list.firstElementChild;

      item.remove();
      container.append(content);

      const createItem = createItemCreator(item, postDir);

      document.addEventListener('search-render', (event) => {
        const { inited, currPage } = event.detail;
        let items = pages.get(currPage);
        if (items === undefined) {
          const index = (currPage - 1) * perPage;
          items = matched.slice(index, index + perPage).map(createItem, keys);
          pages.set(currPage, items);
        }
        list.replaceChildren(...items);
        if (inited) return;
        totalText.data = `${total}`;
        list.hidden = (total === 0);
        container.hidden = false;
      });

      document.addEventListener('search-search', (event) => {
        const { params, query: q = normalizeQuery(params) } = event.detail;
        const inited = (keys !== null) && (q === query);
        if (!inited) {
          pages.clear();
          query = q;
          keys = parseKeys(q);
          if (keys === null) return void (container.hidden = true);
          matched = posts.filter(({ m, r }) => keys.every(e => m.includes(e) || r.includes(e)));
          total = matched.length;
          lastPage = (total > perPage) ? Math.ceil(total / perPage) : 1;
        }
        const page = parsePage(params, lastPage);
        emit('search-render', {
          inited,
          baseURL: `?${new URLSearchParams({ q })}&p=`,
          prevPage: Math.max(page - 1, 1),
          currPage: page,
          nextPage: Math.min(page + 1, lastPage),
        });
      });

      definePager(container);

      if (hasInitQuery) {
        emit('search-search', { params: new URLSearchParams(location.search) });
        classList.remove('search-loading');
      }
    }).catch(() => container.replaceWith(...this.childNodes)));
  }
});

function createItemCreator(template, postDir) {
  const link = template.querySelector('.post-link');
  const titleText = template.querySelector('.post-title').lastChild;
  const senderText = template.querySelector('.post-label').lastChild;
  const sentTime = template.querySelector('.post-sent');
  const sentText = sentTime.lastChild;
  const repliedTime = template.querySelector('.post-replied');
  const repliedText = repliedTime.lastChild;
  const messageContainer = template.querySelector('.post-message');
  const replyContainer = template.querySelector('.post-reply');
  return function (post) {
    const { sent, replied, color = '익명의' } = post;
    const sender = senderText.data = `${color} 쪽지`;
    const text = sentText.data = formatDatetime(sent);
    const highlighter = post.spoiler ? highlightSpoiler : highlight;
    repliedText.data = formatDatetime(replied);
    titleText.data = formatTitle(sent, text, sender);
    link.setAttribute('href', `/${postDir}/${post.id}.html`);
    sentTime.setAttribute('datetime', sent);
    repliedTime.setAttribute('datetime', replied);
    highlighter(this, messageContainer, post.message, post.m);
    highlighter(this, replyContainer, post.reply, post.r);
    const item = template.cloneNode(true);
    messageContainer.replaceChildren();
    replyContainer.replaceChildren();
    return item;
  };
}

function definePager(container) {
  function intercept(event) {
    const link = event.currentTarget;
    if ((link.origin !== origin) || (link.pathname !== pathname)) return;
    event.preventDefault();
    history.pushState(null, '', link.href);
    emit('search-search', { params: new URLSearchParams(link.search) });
    container.setAttribute('tabindex', '-1');
    container.focus({ preventScroll: true });
    container.blur();
    container.removeAttribute('tabindex');
    const y = container.getBoundingClientRect().y - 8;
    if (y < 0) window.scrollBy(0, y);
  }

  const pager = document.getElementById('search-pager').content.firstElementChild;
  customElements.define('search-pager', class extends HTMLElement {
    constructor() {
      super();
      this.append(pager.cloneNode(true));

      const currText  = this.querySelector('.current').lastChild;
      const firstLink = this.querySelector('.first');
      const prevLink  = this.querySelector('.prev');
      const nextLink  = this.querySelector('.next');
      const lastLink  = this.querySelector('.last');
      const firstItem = firstLink.parentNode;
      const prevItem  = prevLink.parentNode;
      const nextItem  = nextLink.parentNode;
      const lastItem  = lastLink.parentNode;

      lastLink.onclick = nextLink.onclick = prevLink.onclick = firstLink.onclick = intercept;

      document.addEventListener('search-render', (event) => {
        if (this.hidden = (total === 0)) return;
        const { inited, baseURL, prevPage, currPage, nextPage } = event.detail;
        prevItem.hidden = firstItem.hidden = (currPage === 1);
        lastItem.hidden = nextItem.hidden = (currPage === lastPage);
        currText.data = `${currPage}`;
        prevLink.setAttribute('href', baseURL + prevPage);
        nextLink.setAttribute('href', baseURL + nextPage);
        if (inited) return;
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

function highlight(keys, node, str, strLowered, start = 0, end = str.length) {
  const keySet = new Set(keys);
  const indexes = new Map();
  for (let i = start, k = 0, n = -1; i < end; n = -1) {
    for (const key of keySet) {
      const cache = indexes.get(key);
      const index = (cache >= i) ? cache : strLowered.indexOf(key, i);
      if (index === -1) {
        keySet.delete(key);
        continue;
      } else if ((n === -1) || (n > index)) {
        n = index;
        k = key.length;
      }
      indexes.set(key, index);
    }
    if ((n === -1) || (n > end)) {
      if (i < end) node.append(str.slice(i, end));
      break;
    }
    if ((i < n) && (n <= end)) {
      node.append(str.slice(i, n));
    }
    i = n + k;
    if (i >= end) break;
    const mark = document.createElement('mark');
    mark.append(str.slice(n, i));
    node.append(mark);
  }
}

function highlightSpoiler(keys, node, str, strLowered) {
  const arr = str.split('`');
  let end = arr[0].length;
  str = arr.join('');
  highlight(keys, node, str, strLowered, 0, end);
  for (let i = 1; i < arr.length; ++i) {
    const mark = document.createElement('mark');
    const spoiler = arr[i];
    const start = end += spoiler.length;
    end += arr[++i].length;
    mark.setAttribute('data-spoiler', spoiler);
    node.append(mark)
    highlight(keys, node, str, strLowered, start, end);
  }
}

function normalizeQuery(params) {
  const query = params.get('q');
  return query ? query.trim() : '';
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

})();
