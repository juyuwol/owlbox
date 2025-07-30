import { pretty } from '../util.js';

export default (label) => pretty`\
<template id="confirm">
  <h2 class="post-label">${label}</h2>
  <pre id="confirm-message" class="post-message"></pre>
</template>`;
