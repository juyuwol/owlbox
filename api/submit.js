import { ipAddress, waitUntil } from '@vercel/functions';
import { renderEmail, renderError } from '../layouts/submit.js';
import { KV_KEY, http, kv, local } from '../src/vercel.js';
import site from '../config.js';

const { maxLength } = site;
const { env } = process;
const deactivated = (site.activated !== true) || !('KV_REST_API_URL' in env);

const sendEmail = (deactivated || (site.notify !== true)) ? null : (() => {
  const { email } = site;
  if (typeof email !== 'string') return null;

  const { RESEND_API_KEY, RESEND_DOMAIN, APPS_SCRIPT_URL } = env;
  const unavailableGoogle = (APPS_SCRIPT_URL === undefined);
  const unavailableResend = (RESEND_API_KEY === undefined) || (RESEND_DOMAIN === undefined);
  if (unavailableGoogle && unavailableResend) return null;

  const useResend = unavailableGoogle || (site.preferredSender === 'resend');
  const headers = { 'Content-Type': 'application/json' };
  const base = { subject: '익명 쪽지 도착', to: email };
  const body = useResend ? 'html': 'htmlBody';
  const endpoint = useResend ? 'https://api.resend.com/emails' : APPS_SCRIPT_URL;

  const request = useResend ? http : async (url, init, message) => {
    const { ok } = await http(url, init, message, true);
    if (ok !== true) throw new Error(message);
  };

  if (useResend) {
    headers.Authorization = `Bearer ${RESEND_API_KEY}`;
    base.from = `${site.title} <owlbox@${RESEND_DOMAIN}>`;
  } else {
    base.name = site.title;
  }

  return (post) => request(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ [body]: renderEmail(post), ...base }),
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

export const POST = deactivated ? (() => respondError(404)) : async (req) => {
  const timestamp = Date.now();
  const id = timestamp.toString(36) + '0';
  const post = { id, sent: local(timestamp), message: '', ip: ipAddress(req) };
  try {
    const form = await req.formData();
    const value = form.get('message');
    if (value === null) throw new Error();
    const { length } = post.message = value.trimEnd().replaceAll('\r\n', '\n');
    if ((length === 0) && (length > maxLength)) throw new Error();
  } catch (e) {
    return respondError(400);
  }
  try { // No need to escape id
    const command = `["HSET","${KV_KEY}","${id}",${JSON.stringify(JSON.stringify(post))}]`;
    await kv(command, 'Failed to store the data.');
  } catch (error) {
    console.error(error);
    return respondError(500);
  }
  if (notify) waitUntil(sendEmail(post).catch(console.error));
  return new Response(null, {
    status: 303,
    headers: {
      'cache-control': 'no-store',
      'location': '/submit/ok.html',
    },
  });
};
