// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

'use strict';
(() => {

const message = localStorage.getItem('message');
if (message === null) return;
customElements.define('confirm-section', class extends HTMLElement {
  connectedCallback() {
    const { content } = document.getElementById('confirm-section');
    content.getElementById('confirm-message').append(message);
    this.append(content);
  }
});

})();
