// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

'use strict';

document.documentElement.classList.add('count-enabled');

document.addEventListener('DOMContentLoaded', () => {
  const count = document.getElementById('message-count').lastChild;
  const button = document.getElementById('message-submit');
  const form = document.getElementById('message-form');
  const textbox = form.elements.message;

  const { maxLength } = textbox;
  const countChars = textbox.oninput = () => {
    const length = textbox.textLength;
    count.data = `${length}`;
    button.disabled = (length > maxLength);
    if (window.onbeforeunload === null) {
      if (length > 0) window.onbeforeunload = warn;
    } else if (length === 0) {
      window.onbeforeunload = null;
    }
  };

  initialize();

  function initialize() {
    form.onsubmit = submit;
    textbox.readOnly = button.disabled = false;
    textbox.removeAttribute('maxlength');
    countChars();
  }

  function submit(event) {
    const message = textbox.value = textbox.value.trimEnd();
    count.data = `${message.length}`;
    textbox.maxLength = maxLength;
    if (!form.reportValidity()) return event.preventDefault();
    form.onsubmit = (event) => event.preventDefault();
    textbox.readOnly = button.disabled = true;
    window.onbeforeunload = null;
    window.addEventListener('pageshow', initialize, { once: true });
    window.sessionStorage.setItem('message', message);
  }

  function warn(event) {
    if (textbox.value.trim() === '') return;
    event.preventDefault();
    event.returnValue = true;
  }
});
