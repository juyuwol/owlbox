// Copyright 2023 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

'use strict';
{

const { classList } = document.documentElement;
classList.add('message-enabled', 'message-loading');

customElements.define('message-init', class extends HTMLElement {
  connectedCallback() {
    const { elements } = document.getElementById('message');
    const content = document.getElementById('message-color');
    const icon = document.getElementById('color-icon');
    const checkbox = document.getElementById('color-remember');

    let value = null;
    try {
      value = localStorage.getItem('color');
    } catch {}
    if (value) {
      for (const radio of elements.color) {
        if (radio.value !== value) continue;
        checkbox.checked = radio.checked = true;
        icon.setAttribute('data-color', value);
        break;
      }
    } else {
      const { value } = elements.color;
      if (value) icon.setAttribute('data-color', value);
    }

    content.onchange = () => {
      const { value } = elements.color;
      if (value) {
        icon.setAttribute('data-color', value);
        if (checkbox.checked) localStorage.setItem('color', value);
      } else {
        icon.removeAttribute('data-color');
        if (checkbox.checked) localStorage.removeItem('color');
      }
    };

    checkbox.onchange = () => {
      if (!checkbox.checked) return localStorage.removeItem('color');
      const { value } = elements.color;
      if (value) localStorage.setItem('color', value);
    };

    this.remove();
    classList.remove('message-loading');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('message');
  const submitButton = form.querySelector('[type=submit]');
  const countText = document.getElementById('message-count').lastChild;
  const { message: messagebox, spoiler: spoilerCheck, color } = form.elements;
  const spoilerDesc = document.getElementById(spoilerCheck.getAttribute('aria-describedby'));
  const { maxLength } = messagebox;

  const getPlainTextLength = () => messagebox.value.replaceAll('`', '').length;
  const getTextLength = () => messagebox.textLength;

  messagebox.oninput = () => {
    const length = (spoilerCheck.checked ? getPlainTextLength : getTextLength)();
    countText.data = `${length}`;
    submitButton.disabled = (length > maxLength);
    if (window.onbeforeunload === null) {
      if (length > 0) window.onbeforeunload = warn;
    } else if (length === 0) {
      window.onbeforeunload = null;
    }
  };

  spoilerCheck.onchange = () => {
    spoilerDesc.hidden = !spoilerCheck.checked;
    messagebox.oninput();
  };

  init();

  function init() {
    spoilerCheck.onclick = null;
    form.onsubmit = submit;
    messagebox.readOnly = submitButton.disabled = false;
    messagebox.removeAttribute('maxlength');
    messagebox.oninput();
  }

  function submit(event) {
    const message = messagebox.value = messagebox.value.trimEnd();
    countText.data = `${message.length}`;
    messagebox.maxLength = maxLength;
    if (!form.reportValidity()) return event.preventDefault();
    messagebox.readOnly = submitButton.disabled = true;
    form.onsubmit = spoilerCheck.onclick = (event) => event.preventDefault();
    window.onbeforeunload = null;
    window.addEventListener('pageshow', init, { once: true });
    localStorage.setItem('message', JSON.stringify({
      message,
      spoiler: spoilerCheck.checked,
      color: color.value || undefined,
    }));
  }

  function warn(event) {
    if (messagebox.value.trim() === '') return;
    event.preventDefault();
    event.returnValue = true;
  }
});

}
