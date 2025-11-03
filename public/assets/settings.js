// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { handleError } from './error.js';

const form = document.getElementById('settings');
const button = form.querySelector('[type=submit]');
const schema = JSON.parse(form.dataset.schema);
const initializers = {
  boolean: (value) => (value === 'on'),
  number: (value) => (value ? +value : null),
};

form.onsubmit = async function submit(event) {
  event.preventDefault();
  form.onsubmit = (event) => event.preventDefault();
  button.disabled = true;
  const data = {};
  for (const [ key, curr ] of new FormData(form).entries()) {
    if (!data.hasOwnProperty(key)) {
      data[key] = curr;
      continue;
    }
    const prev = data[key];
    if (Array.isArray(prev)) {
      prev.push(curr);
    } else {
      data[key] = [prev, curr];
    }
  }
  for (const key in schema) {
    const hasProperty = data.hasOwnProperty(key);
    const value = hasProperty ? data[key] : null;
    const isArray = hasProperty && Array.isArray(value);
    const initialize = initializers[schema[key]];
    data[key] = isArray ? value.map(initialize) : initialize(value);
  }
  try {
    await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    }).then(handleError);
    window.alert(form.dataset.ok);
  } catch (error) {
    window.alert(error.message);
  } finally {
    form.onsubmit = submit;
    button.disabled = false;
  }
};

button.disabled = false;
