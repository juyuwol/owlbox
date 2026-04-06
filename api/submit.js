// Copyright 2023 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import { ipAddress, waitUntil } from '@vercel/functions';
import { renderEmail, renderError } from '../layouts/submit.js';
import { KV_KEY, http, json, kv, local } from '../src/vercel.js';
import site from '../config.js';

const SUBJECT = '익명 쪽지 도착';

const { env } = process;
const { maxLength } = site;
const activated = (site.activated === true) && ('KV_REST_API_URL' in env);

const sendEmail = (!activated || (site.notify !== true)) ? null : (() => {
  const { email } = site;
  const { RESEND_API_KEY, RESEND_DOMAIN, APPS_SCRIPT_URL } = env;
  const unavailableGoogle = !APPS_SCRIPT_URL;
  if (
    (typeof email !== 'string') ||
    (unavailableGoogle && (!RESEND_API_KEY || !RESEND_DOMAIN))
  ) return null;

  const useResend = unavailableGoogle || (site.preferredSender === 'resend');
  const headers = { 'Content-Type': 'application/json' };
  const base = { subject: SUBJECT, to: email };
  const body = useResend ? 'html': 'htmlBody';
  const url = useResend ? 'https://api.resend.com/emails' : APPS_SCRIPT_URL;

  const request = useResend ? http : async (url, init, message) => {
    const res = await json(url, init, message);
    if (res?.ok !== true) throw new Error(message);
  };

  if (useResend) {
    headers.Authorization = `Bearer ${RESEND_API_KEY}`;
    base.from = `${site.title} <${site.generator.name}@${RESEND_DOMAIN}>`;
  } else {
    base.name = site.title;
  }

  return (post) => request(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ [body]: renderEmail(post, SUBJECT), ...base }),
  }, 'Failed to send the email.');
})();

const notify = (sendEmail !== null);

function respondError(status, headers) {
  return new Response(renderError(status), {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/html; charset=utf-8',
      ...headers,
    },
  });
}

export const GET = () => respondError(405, { 'allow': 'POST' });

export const POST = activated ? async (req) => {
  const timestamp = Date.now();
  const id = timestamp.toString(36) + '0';
  const post = { id, sent: local(timestamp), ip: ipAddress(req), message: '' };
  try {
    const form = await req.formData();
    const value = form.get('message');
    if (value === null) throw new Error();
    const message = post.message = value.trimEnd().replaceAll('\r\n', '\n');
    if ((message === '') || (message.length > maxLength)) throw new Error();
    const color = form.get('color');
    const spoiler = form.get('spoiler');
    if (color) post.color = color;
    if (spoiler) post.spoiler = true;
  } catch {
    return respondError(400);
  }
  try { // No need to escape id
    const command = `["HSET","${KV_KEY}","${id}",${JSON.stringify(JSON.stringify(post))}]`;
    await kv(command, 'Failed to store the data.');
  } catch (error) {
    console.error(error);
    return respondError(500);
  }
  if (notify) waitUntil(sendEmail(post));
  return new Response(null, {
    status: 303,
    headers: {
      'cache-control': 'no-store',
      'location': '/submit/ok.html',
    },
  });
} : () => respondError(404);
