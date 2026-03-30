// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

if (!Element.prototype.replaceChildren) {
  Element.prototype.replaceChildren = function () {
    while (this.hasChildNodes()) this.lastChild.remove();
    this.append(...arguments);
  };
}

fetch('index.txt').then(async (res) => {
  const post = location.pathname;
  const id = post.slice(post.lastIndexOf('/') + 1, -5); // '.html'.length: 5
  const ids = (await res.text()).slice(0, -1).split('\n');
  const perPage = +ids.pop();
  const index = ids.indexOf(id);
  if (index < perPage) return;
  const link = document.getElementById('list-link');
  const list = link.pathname;
  const page = Math.trunc(index / perPage) + 1;
  link.setAttribute('href', list.slice(0, list.lastIndexOf('/') + 1) + `${page}.html`);
}).catch(() => {});

const spoilers = document.querySelectorAll('[data-spoiler]');
const message = document.querySelector('.post-message');
const form = document.getElementById('post-setting');
const { view } = form.elements;
let ref = message, img;

form.onchange = () => {
  const { value } = view;
  if (value === 'image') {
    if (!img) {
      img = document.createElement('img');
      img.src = document.querySelector('meta[property="og:image"]').content;
      img.alt = document.querySelector('meta[property="og:image:alt"]').content;
      img.setAttribute('width', document.querySelector('meta[property="og:image:width"]').content);
      img.setAttribute('height', document.querySelector('meta[property="og:image:height"]').content);
    }
    ref.replaceWith(img);
    ref = img;
  } else if (value === 'origin') {
    if (spoilers) for (const e of spoilers) {
      e.replaceChildren(e.getAttribute('data-spoiler'));
    }
    ref.replaceWith(message);
    ref = message;
  } else if (value === 'censored') {
    if (spoilers) for (const e of spoilers) {
      e.replaceChildren();
    }
    if (ref === message) return;
    ref.replaceWith(message);
    ref = message;
  }
};

if (view.value !== view[0].value) {
  form.onchange();
}
