class Block extends Array {
  space = 0;

  render(space) {
    if (space > 0) this.space += space;
    return this;
  }

  toString() {
    return this.join('\n' + ' '.repeat(this.space));
  }
}

export const DO_NOT_SEND = '현재 새 쪽지를 받고 있지 않습니다.';

/**
 * @param {string|null|undefined} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function escapeHTML(value, fallback = '') {
  return (value == null) ? fallback : (value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
  );
}

/**
 * @param {string|null|undefined} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function escapeElement(value, fallback = '') {
  return (value == null) ? fallback : (value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
  );
}

export function formatDateTime(datetime) {
  const month = +datetime.slice(5, 7);
  const day = +datetime.slice(8, 10);
  const date = `${datetime.slice(0, 4)}. ${month}. ${day}.`;
  if (datetime.length === 10) return date;
  return `${date} ${datetime.slice(11, 19)}`;
}

export function pretty(strs, ...exps) {
  const block = new Block('');
  const values = exps.values();
  let i = 0;
  for (const str of strs) {
    const { value, done } = values.next();
    if (str.length > 0) {
      const lines = str.split('\n');
      const values = lines.values();
      block[i] += values.next().value;
      if (lines.length > 1) {
        i = block.push(...values) - 1;
      }
    }
    if (done === true) continue;
    if (value instanceof Block) {
      let values = value.values();
      block[i] += values.next().value;
      if (value.length > 1) {
        const { space } = value;
        if (space > 0) {
          const gap = ' '.repeat(space);
          values = values.map(e => gap + e);
        }
        i = block.push(...values) - 1;
      }
    } else {
      block[i] += value;
    }
  }
  return block;
}
