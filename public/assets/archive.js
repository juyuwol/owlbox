// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { throwIfHttpError } from './util.js';

const form = document.getElementById('import');
const fileInput = form.elements.file;
const submitButton = form.querySelector('[type=submit]');

form.onsubmit = async function submit(event) {
  event.preventDefault();
  form.onsubmit = (event) => event.preventDefault();
  submitButton.disabled = true;
  const { files } = fileInput;
  if (files.length === 0) return;
  try {
    await fetch(form.action, {
      method: 'PUT',
      body: files[0],
      credentials: 'include',
    }).then(throwIfHttpError);
    window.alert(form.getAttribute('data-ok'));
  } catch (error) {
    window.alert(error.message);
  } finally {
    form.onsubmit = submit;
    submitButton.disabled = false;
  }
};

submitButton.disabled = false;
