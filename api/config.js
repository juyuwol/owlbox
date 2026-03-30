// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import { respondError, updateJSON } from '../src/vercel.js';

const EMAIL = /[^@]@[^@]/; // Loose check
const TIME_OFFSET = /^(?:[+\-](?:[01]\d|2[0-3]):[0-5]\d|Z)$/;

const validators = (
  new Map()
  .set('activated', (value) => {
    if ((value === true) || (value === false)) return value;
    throw new Error('"activated" must be true or false.');
  })
  .set('notify', (value) => {
    if ((value === true) || (value === false)) return value;
    throw new Error("'notify' must be true or false.");
  })
  .set('email', (value) => {
    if ((value === null) || (value === '')) return null;
    if ((typeof value === 'string') && EMAIL.test(value)) return value;
    throw new Error('"email" must be an email address if exists.');
  })
  .set('preferredSender', (value) => {
    if ((value === 'google') || (value === 'resend')) return value;
    throw new Error('"preferredSender" must be "google" or "resend".');
  })
  .set('maxLength', (value) => {
    if ((value <= 1000) && (value >= 1) && Number.isInteger(value)) return value;
    throw new Error('"maxLength" must be an integer between 1 to 1000.');
  })
  .set('perPage', (value) => { // Limit to prevent a malicious input
    if ((value >= 1) && (value <= 0x7fff) && Number.isInteger(value)) return value;
    throw new Error('"perPage" must be an integer between 1 to 32767.');
  })
  .set('timeOffset', (value) => {
    if ((typeof value === 'string') && TIME_OFFSET.test(value)) return value;
    throw new Error('"timeOffset" must be a RFC 3339 time-offset.');
  })
  .set('title', (value) => {
    if ((typeof value === 'string') && (value.trim() !== '')) return value;
    throw new Error('"title" must include at least one non-whitespace character.');
  })
);

export async function POST(req) {
  const updates = {};
  try {
    const body = await req.json();
    if (body?.constructor !== Object) {
      throw new TypeError('Request body must be a JSON object.');
    }
    for (const key in body) {
      const value = body[key];
      const validator = validators.get(key);
      updates[key] = validator ? validator(value) : value;
    }
  } catch (error) {
    return respondError(400, error.message);
  }
  try {
    await updateJSON('config.json', updates, 'Update config', Object.assign);
  } catch (error) {
    return respondError(500, error.message);
  }
  return new Response(null, {
    status: 204,
    headers: { 'cache-control': 'no-store' },
  });
}
