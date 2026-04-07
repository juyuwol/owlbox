// © 2023 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import { lockForm, unlockForm, throwIfHttpError } from './util.js';

if (!Element.prototype.replaceChildren) {
  Element.prototype.replaceChildren = function () {
    while (this.hasChildNodes()) this.lastChild.remove();
    this.append(...arguments);
  };
}

const dropTakeMap = (
  Iterator.prototype.map ? (values, start, size, mapper) => {
    values = values.drop(start).take(size);
    return mapper ? values.map(mapper) : values;
  } :
  function* (values, start, size, mapper = (e) => e) {
    if (start > 0) for (const _ of values) {
      if (--start === 0) break;
    }
    if (size > 0) for (const value of values) {
      yield mapper(value);
      if (--size === 0) break;
    }
  }
);

const controllers = new (class AbortControllerSet extends Set {
  abort() {
    for (const e of this) e.abort();
    this.clear();
  }

  create() {
    const controller = new AbortController();
    this.add(controller);
    return controller;
  }
})();

const posts = new Map();
const selectedItems = new Map();
const itemsByPage = new Map();
const publishedIds = [];
const objectURLs = [];
let selected = false;
let dataset = posts;
let tab = '';
let page = 1;
let lastPage = 1;

const baseURL = new URL('/', location.href).href.slice(0, -1);
const {
  offset, offsetMilliseconds,
  perPage,
  postDir,
  unrepliedConfirm, unrepliedOK,
  repliedConfirm, repliedOK,
  deleteConfirm, deleteOK,
} = JSON.parse(document.getElementById('box-config').text);

const { content } = document.getElementById('box-content');
const tabpanel = content.firstElementChild;
const refreshButton = content.getElementById('box-refresh');
const deleteButton = content.getElementById('box-delete');
const statusbar = content.getElementById('box-status');
const totalText = content.getElementById('box-total').lastChild;
const list = content.getElementById('box-list');
const loadingbar = document.getElementById('box-loading');
const tablist = document.getElementById('box-tablist');
const tabs = tablist.elements.tab;

const createUnrepliedItem = (() => {
  const progressTemplate = document.getElementById('box-progress').content;
  const tweetTemplate = document.getElementById('box-tweet').content.firstElementChild;
  const retryTemplate = document.getElementById('box-retry').content.firstElementChild;
  const template = document.getElementById('box-unreplied').content.firstElementChild;
  const sentText = template.querySelector('.sent').lastChild;
  const { id: idInput, sent: sentInput } = template.elements;

  return ({ id, sent, message, color, spoiler }) => {
    idInput.value = id;
    sentText.data = sentInput.value = sent;
    const form = template.cloneNode(true);
    const checkbox = form.querySelector('.select [type=checkbox]');
    const countText = form.querySelector('.count').lastChild;
    const messagebox = form.elements.message;
    if (color) form.elements.color.value = color;
    if (spoiler) form.elements.spoiler.checked = true;
    form.onsubmit = publishPost;
    checkbox.onchange = toggleSelection;
    messagebox.value = message;
    (messagebox.oninput = () => void (countText.data = `${messagebox.textLength}`))();
    return form;
  };

  function removeInputLimit(event) {
    event.currentTarget.removeAttribute('maxlength');
  }

  async function publishPost(event) {
    event.preventDefault();

    const form = event.currentTarget;
    if (form.hasAttribute('data-locked')) return;
    if (!window.confirm(unrepliedConfirm)) return;

    const messagebox = form.elements.message;
    if (messagebox.textLength > 1000) {
      messagebox.maxLength = 1000;
      messagebox.addEventListener('input', removeInputLimit, { once: true });
      form.reportValidity();
      return;
    }

    const post = Object.fromEntries(new FormData(form));
    if (!post.color) delete post.color;
    if (post.spoiler) post.spoiler = true;

    const controller = controllers.create();
    const locked = lockForm(form);
    form.setAttribute('data-locked', '');
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      }).then(throwIfHttpError);
      const blob = await res.blob();
      controller.signal.throwIfAborted();
      const url = URL.createObjectURL(blob);
      post.replied = toLocalDateTime(res.headers.get('last-modified'));
      post.image = url;
      objectURLs.push(url);
    } catch (error) {
      if (error.name === 'AbortError') return;
      form.removeAttribute('data-locked');
      unlockForm(locked);
      window.alert(error.message);
      return;
    } finally {
      controllers.delete(controller);
    }

    const { id } = post;
    publishedIds.push(id);
    deselect(id);

    let { message, reply } = post;
    if (post.spoiler) {
      message = messagebox.value = censorSpoilers(message);
      reply = form.elements.reply.value = censorSpoilers(reply);
    }

    const path = pathById(id);
    const img = form.querySelector('.image');
    img.src = post.image;
    img.alt = message;
    form.querySelector('.select').remove();
    form.querySelector('.link').setAttribute('href', path);
    form.querySelector('.replied').append(post.replied);
    for (const e of form.querySelectorAll('.onpublish[hidden]')) {
      e.hidden = false;
    }

    pollUntilAvailable(form.querySelector('.submit'), path, reply, 10, 10);
    window.alert(unrepliedOK);
  }

  async function pollUntilAvailable(container, path, reply, limit, delay) {
    const controller = controllers.create();
    container.replaceChildren(progressTemplate.cloneNode(true));
    try {
      const { signal } = controller;
      if (delay > 0) {
        const end = performance.now() + (delay * 1000);
        do { // Background tabs throttle timers; check real elasped time.
          await new Promise(second);
          signal.throwIfAborted();
        } while (performance.now() < end);
      }
      const init = { method: 'HEAD', signal };
      while (!(await fetch(path, init)).ok) {
        if (--limit === 0) throw new Error();
        await new Promise(second);
        signal.throwIfAborted();
      }
      const tweetLink = tweetTemplate.cloneNode(true);
      tweetLink.search = tweetQuery(reply, path);
      container.replaceChildren(tweetLink);
    } catch (error) {
      if (error.name === 'AbortError') return;
      const retryButton = retryTemplate.cloneNode(true);
      retryButton.onclick = () => pollUntilAvailable(container, path, reply, 10, 0);
      container.replaceChildren(retryButton);
    } finally {
      controllers.delete(controller);
    }
  }
})();

const createRepliedItem = (() => {
  const template = document.getElementById('box-replied').content.firstElementChild;
  const postLink = template.querySelector('.link');
  const sentText = template.querySelector('.sent').lastChild;
  const messageText = template.querySelector('.message').lastChild;
  const repliedText = template.querySelector('.replied').lastChild;
  const replyText = template.querySelector('.reply').lastChild;
  const tweetLink = template.querySelector('.tweet');
  const { id: idInput, reply: replybox } = template.elements;

  return ({ id, sent, message, color, spoiler, replied, reply }) => {
    const path = pathById(id);
    const safeReply = spoiler ? censorSpoilers(reply) : reply;
    idInput.value = id;
    sentText.data = sent;
    messageText.data = message;
    repliedText.data = replied;
    replybox.value = replyText.data = reply;
    tweetLink.search = tweetQuery(safeReply, path);
    postLink.setAttribute('href', path);
    const form = template.cloneNode(true);
    const checkbox = form.querySelector('.select [type=checkbox]');
    const colorContainer = form.querySelector('.color');
    form.onsubmit = updatePost;
    checkbox.onchange = toggleSelection;
    color ? colorContainer.append(color) : colorContainer.remove();
    return form;
  };

  async function updatePost(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.hasAttribute('data-locked')) return;
    if (!window.confirm(repliedConfirm)) return;
    let aborted = false;
    const post = Object.fromEntries(new FormData(form));
    const controller = controllers.create();
    const locked = lockForm(form);
    form.setAttribute('data-locked', '');
    try {
      const { headers } = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      }).then(throwIfHttpError);
      controller.signal.throwIfAborted();
      post.replied = toLocalDateTime(headers.get('last-modified'));
    } catch (error) {
      if (aborted = (error.name === 'AbortError')) return;
      window.alert(error.message);
      return;
    } finally {
      controllers.delete(controller);
      if (!aborted) {
        form.removeAttribute('data-locked');
        unlockForm(locked);
      }
    }
    const { id, reply } = post;
    const { spoiler } = Object.assign(posts.get(id), post);
    const path = pathById(id);
    const safeReply = spoiler ? censorSpoilers(reply) : reply;
    form.querySelector('.replied').lastChild.data = post.replied;
    form.querySelector('.reply').lastChild.data = reply;
    form.querySelector('.tweet').search = tweetQuery(safeReply, path);
    window.alert(repliedOK);
  }
})();

const createItem = {
  unreplied: createUnrepliedItem,
  replied: createRepliedItem,
};

document.addEventListener('box-render', () => {
  let items = itemsByPage.get(page);
  if (items === undefined) {
    const mapper = selected ? undefined : createItem[tab];
    items = dropTakeMap(dataset.values(), (page - 1) * perPage, perPage, mapper);
  }
  list.replaceChildren(...items);
  statusbar.setAttribute('tabindex', '-1');
  statusbar.focus({ preventScroll: true });
  statusbar.blur();
  statusbar.removeAttribute('tabindex');
  const y = statusbar.getBoundingClientRect().y - 8;
  if (y < 0) window.scrollBy(0, y);
});

{
  const first = () => goTo(1);
  const prev = () => goTo(Math.max(page - 1, 1));
  const next = () => goTo(Math.min(page + 1, lastPage));
  const last = () => goTo(lastPage);
  const template = document.getElementById('box-pager').content.firstElementChild;
  customElements.define('box-pager', class extends HTMLElement {
    constructor() {
      super();
      this.append(template.cloneNode(true));
      const currText = this.querySelector('.current').lastChild;
      const totalText = this.querySelector('.total').lastChild;
      const firstButton = this.querySelector('.first');
      const prevButton = this.querySelector('.prev');
      const nextButton = this.querySelector('.next');
      const lastButton = this.querySelector('.last');
      const render = () => {
        this.hidden = (dataset.size === 0);
        currText.data = `${page}`;
        totalText.data = `${lastPage}`;
        prevButton.disabled = firstButton.disabled = (page === 1);
        lastButton.disabled = nextButton.disabled = (page === lastPage);
      };
      firstButton.onclick = first;
      prevButton.onclick = prev;
      nextButton.onclick = next;
      lastButton.onclick = last;
      document.addEventListener('box-render', render);
      render();
    }
  });
}

if (!tabs.value) for (const e of tabs) {
  if (e.disabled) continue;
  e.checked = true;
  break;
}

deleteButton.onclick = () => (selected ? deleteSelected : renderSelected)();

(refreshButton.onclick = tablist.onchange = async () => {
  tabpanel.remove();
  tablist.after(loadingbar);
  posts.clear();
  selectedItems.clear();
  controllers.abort();
  const controller = controllers.create();
  tab = tabs.value;
  try {
    const { signal } = controller;
    const res = await fetch(`${tab}.json`, { signal }).then(throwIfHttpError);
    const data = await res.json();
    signal.throwIfAborted();
    for (const post of data) {
      const { replied } = post;
      post.sent = normalizeDateTime(post.sent);
      if (replied) post.replied = normalizeDateTime(replied);
      posts.set(post.id, post);
    }
  } catch (error) {
    if (error.name === 'AbortError') return;
    for (const e of tabs) e.checked = false;
    loadingbar.remove();
    window.alert(error.message);
    return;
  } finally {
    controllers.delete(controller);
  }
  deleteButton.disabled = true;
  renderTab();
  loadingbar.replaceWith(tabpanel);
})();

function toggleSelection(event) {
  const { checked, form } = event.currentTarget;
  const id = form.elements.id.value;
  if (selected) {
    if (checked) return;
    deselect(id) ? renderTab() : reset();
  } else {
    checked ? select(id, form) : deselect(id);
  }
}

function select(id, item) {
  selectedItems.set(id, item);
  deleteButton.disabled = false;
}

function deselect(id) {
  selectedItems.delete(id);
  return (selectedItems.size === 0) && (deleteButton.disabled = true);
}

function reset() {
  itemsByPage.clear();
  for (const e of objectURLs) URL.revokeObjectURL(e);
  publishedIds.length = objectURLs.length = 0;
  const { size } = dataset;
  totalText.data = `${size}`;
  lastPage = (size > 1) ? Math.ceil(size / perPage) : 1;
  page = 1;
  document.dispatchEvent(new Event('box-render'));
}

function renderTab() {
  selected = false;
  dataset = posts;
  reset();
}

function renderSelected() {
  let { size } = selectedItems;
  if (size === 0) return;
  for (const e of publishedIds) posts.delete(e);
  for (const id of posts.keys()) {
    const item = selectedItems.get(id);
    if (item === undefined) continue;
    selectedItems.delete(id);
    selectedItems.set(id, item);
    if (--size === 0) break;
  }
  selected = true;
  dataset = selectedItems;
  reset();
}

async function deleteSelected() {
  if (!window.confirm(deleteConfirm)) return;
  deleteButton.disabled = true;
  const controller = controllers.create();
  const params = new URLSearchParams();
  for (const id of selectedItems.keys()) {
    params.append('id', id);
  }
  try {
    await fetch(`${tab}?${params}`, { method: 'DELETE' }).then(throwIfHttpError);
    controller.signal.throwIfAborted();
  } catch (error) {
    if (error.name === 'AbortError') return;
    deleteButton.disabled = false;
    window.alert(error.message);
    return;
  } finally {
    controllers.delete(controller);
  }
  for (const id of selectedItems.keys()) {
    posts.delete(id);
  }
  selectedItems.clear();
  renderTab();
  window.alert(deleteOK);
}

function goTo(newPage) {
  if (!itemsByPage.has(page)) {
    itemsByPage.set(page, Array.from(list.children));
  }
  page = newPage;
  document.dispatchEvent(new Event('box-render'));
}

function censorSpoilers(str) {
  return str.split('`').reduce((a, b, i) => a + ((i % 2) ? '(스포일러)' : b));
}

function normalizeDateTime(datetime) {
  return datetime.endsWith(offset) ? datetime : toLocalDateTime(datetime);
}

function toLocalDateTime(datetime) {
  const epochMilliseconds = Date.parse(datetime) + offsetMilliseconds;
  return new Date(epochMilliseconds).toISOString().slice(0, 19) + offset;
}

function pathById(id) {
  return `/${postDir}/${id}.html`;
}

function second(callback) {
  setTimeout(callback, 1000);
}

function tweetQuery(reply, path) {
  return new URLSearchParams({ text: `${reply} ${baseURL + path}` });
}
