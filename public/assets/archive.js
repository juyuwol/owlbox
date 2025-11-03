// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { handleError } from './error.js';

const form = document.getElementById('import');
const input = form.elements.file;
const button = form.querySelector('[type=submit]');

form.onsubmit = async function submit(event) {
  event.preventDefault();
  form.onsubmit = (event) => event.preventDefault();
  button.disabled = true;
  const { files } = input;
  if (files.length === 0) return;
  try {
    await fetch(form.action, {
      method: 'PUT',
      body: files[0],
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
