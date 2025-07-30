import render from './base.js';
import { pretty } from './util.js';

const { VERCEL_GIT_REPO_OWNER: owner, VERCEL_GIT_REPO_SLUG: repo } = process.env;
const styles = ['/assets/admin.css'];
const labels = {
  '/box/': '쪽지 관리',
  '/box/archive.html': '저장/복원',
  '/box/settings.html': '설정',
};

const paths = Object.keys(labels);

let uninitialized = true;
let manual = ''; // Major version branch URL

export default (page, site, content) => {
  if (uninitialized) {
    const { version, repository } = site.generator;
    manual = `${repository}/tree/v${version.slice(0, version.lastIndexOf('.'))}`;
    uninitialized = false;
  }
  const current = page.path;
  page.styles = styles;
  page.title = `관리: ${labels[current]}`;
  return render(page, site, pretty`\
<nav class="admin-nav">
  <div class="admin-nav-section">
    <p class="admin-nav-heading">바로 가기</p>
    <ul class="admin-nav-list">
      <li class="admin-nav-item"><a href="https://vercel.com/dashboard">Vercel 대시보드</a></li>
      <li class="admin-nav-item"><a href="https://github.com/${owner}/${repo}">GitHub 리포지토리</a></li>
      <li class="admin-nav-item"><a href="${manual}">버전 매뉴얼</a></li>
    </ul>
  </div>
  <div class="admin-nav-section">
    <p class="admin-nav-heading">관리 메뉴</p>
    <ul class="admin-nav-list">${
    pretty(paths.map((path) => (path === current) ? `
      <li class="admin-nav-item"><b>${labels[path]}</b></li>` : `
      <li class="admin-nav-item"><a href="${path}">${labels[path]}</a></li>`
    ))}
    </ul>
  </div>
</nav>
${content}`);
};
