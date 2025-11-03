// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

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

const image = document.createElement('img');
const checkbox = document.getElementById('image-toggle');
const message = document.querySelector('.post-message');
checkbox.disabled = false;
checkbox.onchange = () => {
  if (!checkbox.checked) return image.replaceWith(message);
  const { head } = document;
  image.alt = message.textContent;
  image.src = head.querySelector('meta[property="og:image"]').content;
  image.setAttribute('width', head.querySelector('meta[property="og:image:width"]').content);
  image.setAttribute('height', head.querySelector('meta[property="og:image:height"]').content);
  message.replaceWith(image);
  checkbox.onchange = () => (checkbox.checked ?
    message.replaceWith(image) :
    image.replaceWith(message)
  );
};
