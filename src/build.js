import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import packageJSON from '../package.json' with { type: 'json' };

const normalize = (sep === '/') ? (e => e) : (e => e.replaceAll('/', sep));

const { output, production = false, proxy = false } = parseArgs({
  options: {
    output    : { type: 'string', short: 'o' },
    production: { type: 'boolean' },
    proxy     : { type: 'boolean' },
  },
}).values;

const outputDir = resolve(output);
const sourceDir = process.cwd();

const loadingConfig = readJSONFile(sourceDir + sep + 'config.json');
const loadingLayouts = import(`${pathToFileURL(sourceDir)}/layouts/index.js`);
const makingDirs = (async () => {
  const options = { recursive: true };
  if (proxy) {
    const postsDir = outputDir + sep + 'posts';
    await rm(postsDir, options).catch(ignoreNotFound);
    await mkdir(postsDir, options);
    return;
  }
  const staticDir = sourceDir + sep + 'public';
  if (outputDir !== staticDir) {
    await rm(outputDir, options).catch(ignoreNotFound);
    await cp(staticDir, outputDir, options);
  }
  const fixedDirs = ['box', 'lists', 'posts', 'submit'];
  const promises = fixedDirs.map(e => mkdir(outputDir + sep + e, options));
  const dirs = new Set(fixedDirs);
  const { pages } = await loadingLayouts;
  for (const path in pages) {
    const index = path.lastIndexOf('/');
    if (index <= 0) continue;
    const dir = normalize(path.slice(1, index));
    if (dirs.has(dir)) continue;
    dirs.add(dir);
    promises.push(mkdir(outputDir + sep + dir, options));
  }
  await Promise.all(promises);
})();

// Initialize the configuration

const site = await loadingConfig;
const offset = site.timeOffset;
const offsetMilliseconds = -Date.parse('1970-01-01T00:00:00' + offset);
const baseURL = site.baseURL ??= (e => (e !== undefined) ? `https://${e}` : ''
)(process.env.VERCEL_PROJECT_PRODUCTION_URL);

site.timeOffsetMilliseconds = offsetMilliseconds;
site.generator = (({ displayName, version, repository }) => ({
  name: displayName,
  version,
  repository,
}))(packageJSON);

if (production) {
  // Export the initialized configuration as an ECMAScript module
  const file = sourceDir + sep + 'config.js';
  writeFile(file, `export default ${JSON.stringify(site)};\n`);
}

// Load post data
const [ proxiedPosts, unproxiedPosts ] = await (() => {
  function handleNoData(error) {
    ignoreNotFound(error);
    return [];
  }

  function normalizeDateTime(datetime) {
    /// RFC 3339 full-date (YYYY-mm-dd) length: 10
    if ((datetime.length === 10) || datetime.endsWith(offset)) return datetime;
    const timestamp = Date.parse(datetime);
    return new Date(timestamp + offsetMilliseconds).toISOString().slice(0, -1) + offset;
  }

  function createPost({ id, message, sent, reply, replied, width, height }) {
    const path = `/posts/${id}.html`;
    return {
      path,
      permalink: baseURL + path,
      type: 'post',
      id,
      message,
      sent: normalizeDateTime(sent),
      reply,
      replied: normalizeDateTime(replied),
      image: `/images/${id}.png`,
      width,
      height,
    };
  }

  const dataDir = sourceDir + sep + 'data';
  const proxiedFile = dataDir + sep + 'proxied.jsonl';
  const unproxiedDir = dataDir + sep + 'unproxied';

  return Promise.all([
    readFile(proxiedFile, 'utf-8').then((text) => {
      const posts = [];
      const end = text.length;
      for (let i = 0, k = 0; i < end; i = k + 1) {
        k = text.indexOf('\n', i);
        if (k === -1) k = end;
        const data = JSON.parse(text.slice(i, k));
        posts.push(createPost(data));
      }
      return posts;
    }).catch(handleNoData),

    readdir(unproxiedDir).then((posts) => {
      if (posts.length === 0) return posts;
      return Promise.all(posts.map(async (name) => {
        const data = await readJSONFile(unproxiedDir + sep + name);
        return createPost(data);
      }));
    }).catch(handleNoData),
  ]);
})();

const entirePosts = site.posts = proxiedPosts.concat(unproxiedPosts.sort(compare)).sort(compare);

const { hooks, pages, renderList, renderPost } = await loadingLayouts;

const createPage = (path) => Object.assign({
  path,
  permalink: baseURL + path,
  type: 'page',
}, pages[path]);

const writePage = (page, render = page.layout) => {
  const { path } = page;
  const file = outputDir + normalize(path) + (path.endsWith('/') ? 'index.html' : '');
  return writeFile(file, render(page, site));
};

hooks.prerender?.(site);

await makingDirs;

if (proxy) {
  writePage(createPage('/404.html'));

  for (const post of proxiedPosts) {
    writePage(post, renderPost);
  }
} else {
  {
    const file = outputDir + normalize('/box/replied.json');
    const keys = ['id', 'message', 'sent', 'reply', 'replied', 'color'];
    writeFile(file, JSON.stringify(unproxiedPosts, keys) + '\n');
  }

  for (const path in pages) {
    writePage(createPage(path));
  }

  for (const post of unproxiedPosts) {
    writePage(post, renderPost);
  }

  const { perPage } = site;
  const totalPosts = entirePosts.length;
  const totalPages = (totalPosts > perPage) ? Math.ceil(totalPosts / perPage) : 1;
  const first = `/lists/1.html`;
  const last = `/lists/${totalPages}.html`;
  let path = first;
  let prev = null;
  let i = 0;
  let n = 1;
  do {
    const number = n;
    const posts = entirePosts.slice(i, i += perPage);
    const next = (number < totalPages) ? `/lists/${++n}.html` : null;
    writePage({
      path,
      permalink: baseURL + path,
      type: 'list',
      paginator: { number, posts, totalPosts, totalPages, first, prev, next, last },
    }, renderList);
    prev = path;
    path = next;
  } while (i < totalPosts);
}

function compare(a, b) {
  const aa = a.replied;
  const bb = b.replied;
  return (aa > bb) ? -1 : (aa !== bb) ? 1 : (a.id > b.id) ? -1 : 1;
}

function ignoreNotFound(error) {
  if (error.code === 'ENOENT') return;
  throw error;
}

async function readJSONFile(path) {
  const text = await readFile(path, 'utf-8');
  return JSON.parse(text);
}
