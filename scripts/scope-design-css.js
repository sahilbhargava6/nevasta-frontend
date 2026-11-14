// Scopes the CSS of the design prototype (Navesta_Website_22Sep26.html) under
// `.nv` so it only applies inside design-ported screens. To regenerate, copy
// the prototype's <style> blocks into a file, then run:
//   node scripts/scope-design-css.js <in.css> src/styles/navesta-design.css .
const fs = require('fs');
const [, , input, output, postcssDir] = process.argv;
const postcss = require(require.resolve('postcss', { paths: [postcssDir] }));

const root = postcss.parse(fs.readFileSync(input, 'utf8'));

const scope = (selector) => {
  const s = selector.trim();
  if (s === ':root' || s === 'html' || s === 'body' || s === 'html,body') return '.nv';
  if (/^(html|body)\b/.test(s)) return s.replace(/^(html|body)\b/, '.nv');
  if (s === '*') return '.nv, .nv *';
  if (s.startsWith('*')) return `.nv ${s}`;
  return `.nv ${s}`;
};

root.walkRules((rule) => {
  // Keyframe steps (from / to / 50%) are not selectors
  if (rule.parent && rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
  rule.selectors = rule.selectors.flatMap((sel) => scope(sel).split(/\s*,\s*(?![^(]*\))/));
});

// Design tokens use next/font variables so the same fonts load once
root.append(postcss.parse(
  '.nv{--serif:var(--font-serif),"Playfair Display",Georgia,serif;--sans:var(--font-sans),Inter,system-ui,sans-serif;font-family:var(--sans)}'
));

const header = '/* Ported from Navesta_Website_22Sep26.html and scoped under .nv (generated; edit the design, then regenerate). */\n';
fs.writeFileSync(output, header + root.toString());
console.log('rules:', root.nodes.length, 'bytes:', fs.statSync(output).size);
