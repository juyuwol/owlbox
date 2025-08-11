import { prettify } from '../util.js';

export default (label) => prettify(`\
<template id="confirm">
  <h2 class="post-label">${label}</h2>
  <pre id="confirm-message" class="post-message"></pre>
</template>`);
