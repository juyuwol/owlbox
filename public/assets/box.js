import { handleError } from './error.js';

let posts = null;
let temp = null;
let page = 1;
let size = 1;
let tab = '';

const selectedIds = new Set();
const removedIds = new Set();
const pages = new Map();

const {
  perPage,
  offset,
  offsetMilliseconds,
  unrepliedConfirm,
  unrepliedOK,
  repliedConfirm,
  repliedOK,
  deleteConfirm,
  deleteOK,
} = JSON.parse(document.getElementById('box-config').text);

const fragment = document.getElementById('box-content').content;
const content = fragment.firstElementChild;
const refreshButton = fragment.getElementById('refresh');
const deleteButton = fragment.getElementById('delete');
const statusBlock = fragment.getElementById('box-status');
const totalText = fragment.getElementById('box-total').lastChild;
const list = fragment.getElementById('box-list');
const loadingLine = document.getElementById('box-loading');
const tabForm = document.getElementById('tab');
const tabList = tabForm.elements.tab;
const availables = [...tabList].filter(e => !e.disabled);

const createBlock = {
  unreplied: createUnrepliedCreator(createPublishedCreator()),
  replied: createRepliedCreator(),
  selected: createSelectedCreator(),
};

document.addEventListener('box-render', () => {
  let blocks = pages.get(page);
  if (blocks === undefined) {
    const start = (page - 1) * perPage;
    blocks = (
      ('map' in Iterator.prototype) ?
      posts.values().drop(start).take(perPage) :
      [...posts.values()].slice(start, start + perPage)
    ).map(createBlock[tab]);
  }
  list.replaceChildren(...blocks);
  statusBlock.setAttribute('tabindex', '-1');
  statusBlock.focus({ preventScroll: true });
  statusBlock.blur();
  statusBlock.removeAttribute('tabindex');
  const y = statusBlock.getBoundingClientRect().y - 8;
  if (y < 0) window.scrollBy(0, y);
});

definePager();
defineCheckbox();

if (tabList.value === '') {
  availables[0].checked = true;
}

(refreshButton.onclick = tabForm.onchange = async () => {
  for (const e of availables) {
    e.disabled = true;
  }
  content.remove();
  tabForm.after(loadingLine);
  posts = new Map();
  tab = tabList.value;
  selectedIds.clear();
  initializeDeleteButton();
  try {
    const res = await fetch(`${tab}.json`).then(handleError);
    for (const post of await res.json()) {
      const { sent, replied } = post;
      posts.set(post.id, post);
      post.sent = normalizeDateTime(sent);
      if (replied === undefined) continue;
      post.replied = normalizeDateTime(replied);
    }
  } catch (error) {
    for (const e of tabList) {
      e.checked = false;
    }
    loadingLine.remove();
    return window.alert(error.message);
  }
  initializePage();
  loadingLine.replaceWith(content);
  for (const e of availables) {
    e.disabled = false;
  }
})();

function createPublishedCreator() {
  async function untilPublished(url, delay, limit) {
    const init = { method: 'HEAD' };
    const sleep = (e) => void setTimeout(e, 1000, true);
    if (delay > 0) await new Promise(e => void setTimeout(e, delay * 1000));
    do {
      const { ok } = await fetch(url, init);
      if (ok) return;
    } while ((--limit > 0) && (await new Promise(sleep)));
    throw new Error();
  }

  const tweetTemplate = document.getElementById('box-published-tweet').content.firstElementChild;
  const retryTemplate = document.getElementById('box-published-retry').content.firstElementChild;
  const blockTemplate = document.getElementById('box-published').content.firstElementChild;
  const sentText = blockTemplate.querySelector('.sent').lastChild;
  const messageText = blockTemplate.querySelector('.message').lastChild;
  const repliedText = blockTemplate.querySelector('.replied').lastChild;
  const replyText = blockTemplate.querySelector('.reply').lastChild;
  const image = blockTemplate.querySelector('.image');
  const link = blockTemplate.querySelector('.link');

  return async ({ id, reply, message, sent }, res) => {
    const loading = res.blob();
    sentText.data = sent;
    messageText.data = image.alt = message;
    repliedText.data = local(res.headers.get('last-modified'));
    replyText.data = reply;
    link.href = pathById(id);

    const url = link.href;
    const tweetLine = tweetTemplate.cloneNode(true);
    const tweet = tweetLine.querySelector('.tweet');
    tweet.search = new URLSearchParams({ text: `${reply} ${url}` });
    image.src = URL.createObjectURL(await loading);

    const block = blockTemplate.cloneNode(true);
    const loadingBar = block.querySelector('.loading');

    const enable = () => loadingBar.replaceWith(tweetLine);
    untilPublished(url, 10, 10).then(enable).catch(() => {
      const retry = retryTemplate.cloneNode(true);
      const button = retry.querySelector('.retry');
      loadingBar.replaceWith(retry);
      button.onclick = async () => {
        retry.replaceWith(loadingBar);
        try {
          await untilPublished(url, 0, 10);
        } catch (e) {
          return loadingBar.replaceWith(retry);
        }
        enable();
        retry.replaceWith(tweetLine);
      };
    });

    return block;
  };
}

function createUnrepliedCreator(createPublished) {
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const { elements } = form;
    const { message } = elements;
    if (message.textLength > 1000) {
      const { oninput } = message;
      message.maxLength = 1000;
      form.reportValidity();
      message.oninput = () => {
        message.removeAttribute('maxlength');
        (message.oninput = oninput)();
      };
      return;
    }
    if (!window.confirm(unrepliedConfirm)) return;
    const { reply } = elements;
    const button = form.querySelector('[type=submit]');
    form.onsubmit = (event) => event.preventDefault();
    message.readOnly = reply.readOnly = button.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      }).then(handleError);
      const { id } = data;
      removedIds.add(id);
      if (selectedIds.delete(id) && (selectedIds.size === 0)) {
        deleteButton.disabled = true;
      }
      form.replaceWith(await createPublished(data, res));
      cachePage();
      window.alert(unrepliedOK);
    } catch (error) {
      form.onsubmit = submit;
      message.readOnly = reply.readOnly = button.disabled = false;
      window.alert(error.message);
    }
  }

  const template = document.getElementById('box-unreplied').content.firstElementChild;
  const sentText = template.querySelector('.sent').lastChild;
  const { id: idInput, sent: sentInput } = template.elements;

  return (post) => {
    sentText.data = sentInput.value = post.sent;
    const id = idInput.value = post.id;
    const form = template.cloneNode(true);
    const count = form.querySelector('.count').lastChild;
    const { message } = form.elements;
    message.value = post.message;
    (message.oninput = () => void (count.data = `${message.textLength}`))();
    form.onsubmit = submit;
    form.setAttribute('id', id);
    return form;
  };
}

function createRepliedCreator() {
  async function submit(event) {
    event.preventDefault();
    if (!window.confirm(repliedConfirm)) return;
    const form = event.currentTarget;
    const button = form.querySelector('[type=submit]');
    const { reply } = form.elements;
    form.onsubmit = (event) => event.preventDefault();
    reply.readOnly = button.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      const { headers } = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      }).then(handleError);
      const repliedText = form.querySelector('.replied').lastChild;
      const replyText = form.querySelector('.reply').lastChild;
      repliedText.data = local(headers.get('last-modified'));
      replyText.data = data.reply;
      window.alert(repliedOK);
    } catch (error) {
      window.alert(error.message);
    } finally {
      form.onsubmit = submit;
      reply.readOnly = button.disabled = false;
    }
  }

  const template = document.getElementById('box-replied').content.firstElementChild;
  const link = template.querySelector('.sent');
  const sentText = link.lastChild;
  const messageText = template.querySelector('.message').lastChild;
  const repliedText = template.querySelector('.replied').lastChild;
  const replyText = template.querySelector('.reply').lastChild;
  const { id: idInput, reply: replyInput } = template.elements;

  return (post) => {
    const id = idInput.value = post.id;
    link.href = pathById(id);
    sentText.data = post.sent;
    messageText.data = post.message;
    repliedText.data = post.replied;
    replyInput.value = replyText.data = post.reply;
    const form = template.cloneNode(true);
    form.setAttribute('id', id);
    form.onsubmit = submit;
    return form;
  };
}

function createSelectedCreator() {
  function deselect(event) {
    const checkbox = event.currentTarget;
    if (checkbox.checked) return;
    posts.delete(checkbox.value);
    if (posts.size === 0) {
      restore();
    } else {
      initializePage();
    }
  }

  const template = document.getElementById('box-selected').content.firstElementChild;
  const sentText = template.querySelector('.sent').lastChild;
  const messageText = template.querySelector('.message').lastChild;
  const repliedBlock = template.querySelector('.replied');
  const repliedText = repliedBlock.lastChild;
  const replyBlock = template.querySelector('.reply');
  const replyText = replyBlock.lastChild;

  return (post) => {
    const { reply } = post;
    const unreplied = replyBlock.hidden = repliedBlock.hidden = (reply === undefined);
    sentText.data = post.sent;
    messageText.data = post.message;
    if (unreplied) {
      replyText.data = repliedText.data = '';
    } else {
      repliedText.data = post.replied;
      replyText.data = reply;
    }
    const block = template.cloneNode(true);
    const checkbox = block.querySelector('[type=checkbox]');
    checkbox.checked = true;
    checkbox.value = post.id;
    checkbox.onchange = deselect;
    return block;
  };
}

function defineCheckbox() {
  function toggle(event) {
    const checkbox = event.currentTarget;
    const id = checkbox.value;
    if (checkbox.checked) {
      selectedIds.add(id);
      deleteButton.disabled = false;
    } else if (selectedIds.delete(id) && (selectedIds.size === 0)) {
      deleteButton.disabled = true;
    }
  }

  const template = document.getElementById('box-checkbox').content.firstElementChild;
  customElements.define('box-checkbox', class extends HTMLElement {
    constructor() {
      super();
      this.append(template.cloneNode(true));
      const checkbox = this.querySelector('[type=checkbox]')
      checkbox.value = checkbox.form.getAttribute('id');
      checkbox.onchange = toggle;
    }
  });
}

function definePager() {
  function turnPage(newPage) {
    if (!pages.has(page)) cachePage();
    page = newPage;
    emit('box-render');
  }

  const turnToFirst = () => turnPage(1);
  const turnToPrev = () => turnPage(Math.max(page - 1, 1));
  const turnToNext = () => turnPage(Math.min(page + 1, size));
  const turnToLast = () => turnPage(size);

  const template = document.getElementById('box-pager').content.firstElementChild;
  customElements.define('box-pager', class extends HTMLElement {
    constructor() {
      super();
      this.append(template.cloneNode(true));

      const currText = this.querySelector('.box-pager-curr').lastChild;
      const sizeText = this.querySelector('.box-pager-size').lastChild;
      const firstButton = this.querySelector('.box-pager-first');
      const prevButton = this.querySelector('.box-pager-prev');
      const nextButton = this.querySelector('.box-pager-next');
      const lastButton = this.querySelector('.box-pager-last');

      const render = () => {
        this.hidden = (posts.size === 0);
        currText.data = `${page}`;
        sizeText.data = `${size}`;
        prevButton.disabled = firstButton.disabled = (page === 1);
        lastButton.disabled = nextButton.disabled = (page === size);
      };

      document.addEventListener('box-render', render);
      firstButton.onclick = turnToFirst;
      prevButton.onclick = turnToPrev;
      nextButton.onclick = turnToNext;
      lastButton.onclick = turnToLast;
      render();
    }
  });
}

async function deleteItems() {
  if (!window.confirm(deleteConfirm)) return;
  deleteButton.disabled = true;
  const ids = [...posts.keys()];
  try {
    await fetch(temp.tab, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ids),
      credentials: 'include',
    }).then(handleError);
  } catch (error) {
    deleteButton.disabled = false;
    return window.alert(error.message);
  }
  for (const id of ids) {
    temp.delete(id);
  }
  restore();
  window.alert(deleteOK);
}

function cachePage() {
  pages.set(page, Array.from(list.children));
}

function initializePage() {
  removedIds.clear();
  pages.clear();
  const total = posts.size;
  page = 1;
  size = (total > 1) ? Math.ceil(total / perPage) : 1;
  totalText.data = `${total}`;
  emit('box-render');
}

function initializeDeleteButton() {
  temp = null;
  deleteButton.onclick = renderSelected;
  deleteButton.disabled = true;
}

function renderSelected() {
  if (selectedIds.size === 0) return;
  posts.tab = tab;
  tab = 'selected';
  temp = posts;
  posts = new Map();
  deleteButton.onclick = deleteItems;
  const ids = [...selectedIds].sort((a, b) => (a < b) ? 1 : -1);
  for (const id of ids) {
    posts.set(id, temp.get(id));
  }
  for (const id of removedIds) {
    temp.delete(id);
  }
  selectedIds.clear();
  initializePage();
}

function restore() {
  posts = temp;
  tab = posts.tab;
  initializeDeleteButton();
  initializePage();
}

function emit(type) {
  document.dispatchEvent(new Event(type));
}

function local(date) {
  return new Date(Date.parse(date) + offsetMilliseconds).toISOString().slice(0, 19) + offset;
}

function pathById(id) {
  return `/posts/${id}.html`;
}

function normalizeDateTime(datetime) {
  if (datetime.endsWith(offset)) return datetime;
  const timestamp = Date.parse(datetime);
  return new Date(timestamp + offsetMilliseconds).toISOString().slice(0, -1) + offset;
}
