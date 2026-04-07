// © 2025 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

'use strict';
{
const text = localStorage.getItem('message');
if (text) customElements.define('confirm-section', class extends HTMLElement {
  connectedCallback() {
    const { message, spoiler, color } = JSON.parse(text);
    const { content } = document.getElementById('confirm-section');
    const container = content.getElementById('confirm-message');
    const icon = content.getElementById('confirm-icon');
    if (color) {
      icon.setAttribute('data-color', color);
      icon.after(` ${color}`);
    } else {
      icon.parentNode.remove();
    }
    if (spoiler) {
      const children = message.split('`');
      const end = children.length;
      for (let i = 1; i < end; i += 2) {
        const mark = document.createElement('mark');
        mark.append(children[i]);
        children[i] = mark;
      }
      container.append(...children);
    } else {
      container.append(message);
    }
    this.append(content);
  }
});
}
