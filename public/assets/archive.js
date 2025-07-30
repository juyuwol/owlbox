// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { handleError } from './error.js';

const form = document.getElementById('import');
const button = document.getElementById('import-submit');

const submit = form.onsubmit = async (event) => {
  event.preventDefault();
  form.onsubmit = (event) => event.preventDefault();
  button.disabled = true;
  const { files } = form.elements.file;
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
