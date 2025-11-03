import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';
import packageJSON from '../package.json' with { type: 'json' };

const normalize = (sep === '/') ? (e => e) : (e => e.replaceAll('/', sep));

const { output, mode = 'dev', suffix = '' } = parseArgs({
  options: {
    output: { type: 'string', short: 'o' },
    mode  : { type: 'string', short: 'm' },
    suffix: { type: 'string' },
  },
}).values;

const outputDir = resolve(output);
const sourceDir = process.cwd();

const listName = `lists${suffix}`;
const postName = `posts${suffix}`;
const searchName = `search${suffix}`;

const loadingConfig = readJSONFile(sourceDir + sep + 'config.json');
const loadingLayouts = import('../layouts/index.js');

const makingDirs = (async () => {
  const options = { recursive: true };
  if (mode === 'proxy') {
    const path = outputDir + sep + postName;
    await rm(path, options).catch(ignoreNotFound);
    await mkdir(path, options);
    return;
  }

  const archive = (mode === 'archive');
  const fixedDirs = [listName, postName, searchName];
  if (archive) {
    await Promise.all(fixedDirs.map(async (name) => {
      const path = outputDir + sep + name;
      await rm(path, options).catch(ignoreNotFound);
      await mkdir(path, options);
    }));
    return;
  }

  const staticDir = sourceDir + sep + 'public';
  if (outputDir !== staticDir) {
    await rm(outputDir, options).catch(ignoreNotFound);
    await cp(staticDir, outputDir, options);
  }
  
  fixedDirs.push('box', 'submit');
  const promises = fixedDirs.map(e => mkdir(outputDir + sep + e, options));
  return (pages) => {
    const dirs = new Set(fixedDirs);
    for (const path in pages) {
      const index = path.lastIndexOf('/');
      if (index < 2) continue;
      const dir = normalize(path.slice(1, index));
      if (dirs.has(dir)) continue;
      promises.push(mkdir(outputDir + sep + dir, options));
      dirs.add(dir);
    }
    return Promise.all(promises);
  };
})();

// Initialize the configuration

const site = await loadingConfig;
const offset = site.timeOffset;
const offsetMilliseconds = -Date.parse('1970-01-01T00:00:00' + offset);
const baseURL = site.baseURL ??= (e => (e !== undefined) ? `https://${e}` : ''
)(process.env.VERCEL_PROJECT_PRODUCTION_URL);

site.suffix = suffix;
site.timeOffsetMilliseconds = offsetMilliseconds;
site.generator = {
  name: packageJSON.name,
  displayName: packageJSON.displayName,
  version: packageJSON.version,
  repository: packageJSON.repository,
};

// Load post data

const dataDir = sourceDir + sep + 'data';
const proxiedFile = dataDir + sep + `proxied${suffix}.jsonl`;
const unproxiedDir = dataDir + sep + 'unproxied';

const promise = readFile(proxiedFile, 'utf-8').then((text) => {
  const posts = [];
  const end = text.length;
  for (let i = 0, k = 0; i < end; i = k + 1) {
    k = text.indexOf('\n', i);
    if (k === -1) k = end;
    const data = JSON.parse(text.slice(i, k));
    posts.push(createPost(data));
  }
  return posts;
}).catch(handleNoData);

const unproxiedPosts = (
  (mode === 'archive') ? [] :
  await readdir(unproxiedDir).then(async (names) => {
    if (names.length === 0) return names;
    return (await Promise.all(names.map(async (name) => {
      const data = await readJSONFile(unproxiedDir + sep + name);
      return createPost(data);
    }))).sort(compare);
  }).catch(handleNoData)
);

const proxiedPosts = await promise;
const entirePosts = proxiedPosts.concat(unproxiedPosts).sort(compare);
const totalPosts = site.totalPosts = entirePosts.length;

if (mode === 'production') {
  // Export the initialized configuration as an ECMAScript module
  const file = sourceDir + sep + 'config.js';
  writeFile(file, `export default ${JSON.stringify(site)};\n`);
}

site.posts = entirePosts;
const { createPages, renderList, renderPost } = await loadingLayouts;
const pages = createPages(site);

await (await makingDirs)?.(pages);

if (mode === 'proxy') {
  writePage(createPage('/404.html'));

  for (const post of proxiedPosts) {
    writePage(post, renderPost);
  }
} else {
  if (mode === 'archive') {
    const postDir = `${postName}/`;
    const searchDir = `${searchName}/`;
    for (const path in pages) {
      if (path.startsWith(postDir, 1) || path.startsWith(searchDir, 1)) {
        writePage(createPage(path));
      }
    }

    writePage(createPage('/404.html'));

    for (const post of proxiedPosts) {
      writePage(post, renderPost);
    }
  } else {
    const file = outputDir + normalize('/box/replied.json');
    const keys = ['id', 'message', 'sent', 'reply', 'replied', 'color'];
    writeFile(file, JSON.stringify(unproxiedPosts, keys) + '\n');

    for (const path in pages) {
      writePage(createPage(path));
    }
  }

  for (const post of unproxiedPosts) {
    writePage(post, renderPost);
  }

  const { perPage } = site;
  const totalPages = (totalPosts > perPage) ? Math.ceil(totalPosts / perPage) : 1;
  const first = `/${listName}/1.html`;
  const last = `/${listName}/${totalPages}.html`;
  let path = first, prev = null, i = 0, n = 1;
  do {
    const number = n;
    const posts = entirePosts.slice(i, i += perPage);
    const next = (number < totalPages) ? `/${listName}/${++n}.html` : null;
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
  const aa = a.replied, bb = b.replied;
  return (aa > bb) ? -1 : (aa !== bb) ? 1 : (a.id > b.id) ? -1 : 1;
}

function createPage(path) {
  const page = { path, permalink: baseURL + path, type: 'page' };
  return Object.assign(page, pages[path]);
}

function createPost({ id, message, sent, reply, replied, width, height, color }) {
  const path = `/${postName}/${id}.html`;
  return {
    path,
    permalink: baseURL + path,
    type: 'post',
    id,
    message,
    sent: normalizeDateTime(sent),
    reply,
    replied: normalizeDateTime(replied),
    image: `/images${suffix}/${id}.png`,
    width,
    height,
    color,
  };
}

function handleNoData(error) {
  ignoreNotFound(error);
  return [];
}

function ignoreNotFound(error) {
  if (error.code === 'ENOENT') return;
  throw error;
}

async function readJSONFile(path) {
  const text = await readFile(path, 'utf-8');
  return JSON.parse(text);
}

function normalizeDateTime(datetime) {
  // RFC 3339 full-date (YYYY-mm-dd) length: 10
  if ((datetime.length === 10) || datetime.endsWith(offset)) return datetime;
  const timestamp = Date.parse(datetime);
  return new Date(timestamp + offsetMilliseconds).toISOString().slice(0, -1) + offset;
}

function writePage(page, render = page.layout) {
  const { path } = page;
  const file = outputDir + normalize(path) + (path.endsWith('/') ? 'index.html' : '');
  return writeFile(file, render(page, site));
}
