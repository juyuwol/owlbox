// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

'use strict';
{

const html = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');

const initialize = () => {
  let theme = null;
  try {
    theme = localStorage.getItem('theme');
  } catch (e) {}
  if (theme) {
    html.setAttribute('data-theme', theme);
  } else {
    html.removeAttribute('data-theme');
  }
};

initialize();

customElements.define('theme-panel', class extends HTMLElement {
  connectedCallback() {
    const { content } = document.getElementById('theme-panel');
    const checkbox = content.getElementById('theme-toggle');
    const text = checkbox.nextSibling;

    const render = media.onchange = () => {
      const theme = media.matches ? 'light' : 'dark';
      checkbox.checked = (html.getAttribute('data-theme') === theme);
      text.data = ' ' + this.getAttribute(`data-${theme}`);
    };

    checkbox.onchange = () => {
      if (checkbox.checked) {
        const theme = media.matches ? 'light' : 'dark';
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      } else {
        html.removeAttribute('data-theme');
        localStorage.removeItem('theme');
      }
    };

    window.onpageshow = (event) => {
      if (!event.persisted) return;
      initialize();
      render();
    };

    render();
    this.append(content);
  }
});

}
