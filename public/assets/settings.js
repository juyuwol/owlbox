// © 2025 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { lockForm, unlockForm, throwIfHttpError } from './util.js';

const form = document.getElementById('settings');
const submitButton = form.querySelector('[type=submit]');
const defaults = serialize(form, {});

form.onchange = (event) => {
  const { target } = event;
  if (valueOf(target) !== defaults[target.name]) {
    submitButton.disabled = false;
  } else if (serialize(form, defaults) === null) {
    submitButton.disabled = true;
  }
};

form.onsubmit = async (event) => {
  event.preventDefault();
  if (form.hasAttribute('data-locked')) return;
  const data = serialize(form, defaults);
  submitButton.disabled = true;
  if (data === null) return;
  const locked = lockForm(form);
  form.setAttribute('data-locked', '');
  try {
    await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    }).then(throwIfHttpError);
    window.alert(form.getAttribute('data-ok'));
    Object.assign(defaults, data);
  } catch (error) {
    submitButton.disabled = false;
    window.alert(error.message);
  } finally {
    form.removeAttribute('data-locked');
    unlockForm(locked);
  }
};

function serialize(form, defaults) {
  const { elements, length } = form;
  const data = {};
  const names = new Set();
  for (let i = 0; i < length; ++i) {
    const element = elements[i];
    if (element.disabled) continue;
    const { name } = element;
    if (!name || names.has(name)) continue;
    const value = valueOf(element);
    if ((value === undefined) || (value === defaults[name])) continue;
    data[name] = value;
    names.add(name);
  }
  return (names.size > 0) ? data : null;
}

function valueOf(element) {
  if (element instanceof HTMLInputElement) switch (element.type) {
    case 'number': {
      const value = element.valueAsNumber;
      if (Number.isNaN(value)) return; // Ignore NaN
      return value;
    }
    case 'checkbox': // Treat checkboxes that have no value as booleans
      if (!element.hasAttribute('value')) return element.checked;
    case 'radio': // Ignore unchecked checkboxes and radio buttons
      if (!element.checked) return;
  }
  return element.value;
}
