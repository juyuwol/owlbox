import { escapeElement as e, escapeHTML as h } from './util.js';

let uninitialized = true;
let generator = '';
let siteNode = '';
let siteAttr = '';
let description = '';
let footerURL = '';
let footerLabel = '';
let hideLogin = true;

export default (page, site, content) => {
  if (uninitialized) {
    const { generator: { displayName, version }, title } = site;
    generator = `${e(displayName)} ${version}`;
    siteNode = h(title);
    siteAttr = e(title);
    description = e(site.description);
    footerURL = e(site.footerURL);
    footerLabel = h(site.footerLabel);
    hideLogin = (site.showLogin !== true);
    uninitialized = false;
  }
  const { path, title, beforeHeadEnd, beforeBodyEnd } = page;
  const isHome = (path === '/');
  const titleTag = (page.notitle === true) ? 'h1' : 'p';
  return `\
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${h(title)} | ${siteNode}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/assets/default.css">${
  page.styles?.reduce((code, path) => code + `
  <link rel="stylesheet" href="${path}">`, '') ?? ''}${
  page.scriptsModule?.reduce((code, path) => code + `
  <script src="${path}" type="module"></script>`, '') ?? ''}${hideLogin ? `
  <script src="/assets/theme.js"></script>` : ''}${
  page.scripts?.reduce((code, path) => code + `
  <script src="${path}"></script>`, '') ?? ''}
  <link rel="icon" href="/favicon.ico">${
  (page.type === 'post') ? `
  <link rel="canonical" href="${page.permalink}">
  <meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${siteAttr}">
  <meta property="og:image" content="${site.baseURL + page.image}">
  <meta property="og:image:alt" content="${e(page.message)}">
  <meta property="og:image:width" content="${page.width}">
  <meta property="og:image:height" content="${page.height}">
  <meta name="twitter:card" content="summary_large_image">` :
  (page.canonical !== true) ? '' : `
  <link rel="canonical" href="${page.permalink}">
  <meta property="og:title" content="${isHome ? siteAttr : e(title)}">
  <meta property="og:description" content="${isHome ? description : siteAttr}">
  <meta property="og:image" content="${site.baseURL}/icon.png">
  <meta name="twitter:card" content="summary">`}
  <meta name="generator" content="${generator}">
  <template id="theme-panel">
    <label class="label-checkbox"><input id="theme-toggle" type="checkbox"> </label>
  </template>${(beforeHeadEnd === undefined) ? '' : `
  ${beforeHeadEnd.toString(2)}`}
</head>
<body>
  <header class="header">
    <div class="content header-content nav">
      <${titleTag} class="site-title"><a href="/">${siteNode}</a></${titleTag}>
      ${(hideLogin || (path?.startsWith('box/', 1) === true)) ? `\
<theme-panel data-dark="어둡게" data-light="밝게"></theme-panel>` : `\
<p class="login"><a href="/box/">로그인</a></p>`}
    </div>
  </header>
  <main class="main">
    <div id="main-content" class="content main-content">
      ${content.toString(6)}
    </div>
  </main>
  <footer class="footer">
    <address class="content footer-content nav">
      <a href="${footerURL}">${footerLabel}</a>
    </address>
  </footer>${(beforeBodyEnd === undefined) ? '' : `
  ${beforeBodyEnd.toString(2)}`}
</body>
</html>
`;
};
