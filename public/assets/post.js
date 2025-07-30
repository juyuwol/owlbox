// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

fetch('index.txt').then(async (res) => {
  const id = location.pathname.slice(7, -5); // '/posts/'.length: 7, '.html'.length: 5
  const ids = (await res.text()).slice(0, -1).split('\n');
  const perPage = +ids.pop();
  const index = ids.findIndex(e => (e === id));
  if (index < perPage) return;
  const link = document.getElementById('list-link');
  link.href = `/lists/${Math.trunc(index / perPage) + 1}.html`;
}).catch(() => {});

const image = document.createElement('img');
const checkbox = document.getElementById('toggle-image');
const message = document.querySelector('.post-message');
const parent = message.parentNode;
checkbox.disabled = checkbox.checked = false;
checkbox.onchange = () => {
  if (checkbox.checked) {
    const { head } = document;
    image.src = head.querySelector('meta[property="og:image"]').content;
    image.width = head.querySelector('meta[property="og:image:width"]').content;
    image.height = head.querySelector('meta[property="og:image:height"]').content;
    image.alt = message.textContent;
    parent.replaceChild(image, message);
    checkbox.onchange = () => void (
      checkbox.checked ?
      parent.replaceChild(image, message) :
      parent.replaceChild(message, image)
    );
  } else {
    parent.replaceChild(message, image);
  }
};
