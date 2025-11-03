'use strict';
{

const { classList } = document.documentElement;
classList.add('message-enabled', 'message-loading');

customElements.define('message-color', class extends HTMLElement {
  connectedCallback() {
    const { elements } = document.getElementById('message');
    const content = document.getElementById('message-color');
    const icon = document.getElementById('color-icon');
    const checkbox = document.getElementById('color-remember');

    let value = null;
    try {
      value = localStorage.getItem('color');
    } catch (e) {}
    if (value) {
      const { color } = elements;
      for (let i = color.length - 1; i >= 0; --i) {
        const radio = color[i];
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
  const count = document.getElementById('message-count').lastChild;
  const button = form.querySelector('[type=submit]');
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
    localStorage.setItem('message', message);
  }

  function warn(event) {
    if (textbox.value.trim() === '') return;
    event.preventDefault();
    event.returnValue = true;
  }
});

}
