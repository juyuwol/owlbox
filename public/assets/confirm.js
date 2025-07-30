// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

'use strict';

(() => {

const message = window.sessionStorage.getItem('message');
if (message === null) return;

const { classList } = document.documentElement;
classList.add('confirm-busy');

document.addEventListener('DOMContentLoaded', () => {
  const { content } = document.getElementById('confirm');
  content.getElementById('confirm-message').append(message);
  document.getElementById('main-content').append(content);
  classList.remove('confirm-busy');
});

})();
