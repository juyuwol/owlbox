// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { handleError } from './error.js';

const form = document.getElementById('settings');
const submitButton = form.querySelector('[type=submit]');

form.onsubmit = async function submit(event) {
  event.preventDefault();
  form.onsubmit = (event) => event.preventDefault();
  submitButton.disabled = true;
  const { elements } = form;
  const data = {};
  for (let i = elements.length - 1; i >= 0; --i) {
    const element = elements[i];
    if (element.disabled) continue;
    const { name } = element;
    const schema = element.getAttribute('data-type');
    if (schema === 'boolean') {
      data[name] = element.checked;
    } else if (schema === 'number') {
      data[name] = element.valueAsNumber;
    } else {
      data[name] = element.value;
    }
  }
  try {
    await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    }).then(handleError);
    window.alert(form.getAttribute('data-ok'));
  } catch (error) {
    window.alert(error.message);
  } finally {
    form.onsubmit = submit;
    submitButton.disabled = false;
  }
};

submitButton.disabled = false;
