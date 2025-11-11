// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { handleError } from './error.js';

const form = document.getElementById('settings');
const submitButton = form.querySelector('[type=submit]');
const schema = JSON.parse(form.getAttribute('data-schema'));
const initializers = {
  boolean: (value) => (value === 'on'),
  number: (value) => (value ? +value : null),
};

form.onsubmit = async function submit(event) {
  event.preventDefault();
  form.onsubmit = (event) => event.preventDefault();
  submitButton.disabled = true;
  const formData = new FormData(form);
  const keys = new Set();
  const dups = new Set();
  const data = {};
  for (const key of formData.keys()) (keys.has(key) ? dups : keys).add(key);
  for (const key of keys) {
    const uninited = schema.hasOwnProperty(key);
    if (dups.has(key)) {
      const value = formData.getAll(key);
      data[key] = uninited ? value.map(initializers[schema[key]]) : value;
    } else {
      const value = formData.get(key);
      data[key] = uninited ? initializers[schema[key]](value) : value;
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
