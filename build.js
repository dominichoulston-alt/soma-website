// Build step for Decap CMS: merges content/*.yml into the HTML templates and
// copies everything else untouched into dist/, which Netlify publishes.
'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

const EXCLUDE = new Set([
  'dist', 'node_modules', '.git', '.gitignore', 'content',
  'package.json', 'package-lock.json', 'build.js', 'netlify.toml'
]);

// template HTML file -> its content YAML file
const CONTENT_MAP = {
  'index.html': 'content/home.yml',
  'services.html': 'content/services.yml',
  'experience.html': 'content/experience.yml',
  'about.html': 'content/about.yml',
  'leadership.html': 'content/leadership.yml'
};

function loadYaml(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return {};
  return yaml.load(fs.readFileSync(full, 'utf8')) || {};
}

// resolve a dot-path like "hero.line1" or "sectors.0.title" against a content object
function resolvePath(data, key) {
  const parts = key.split('.');
  let node = data;
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return node;
}

// escape text for safe insertion as element inner content
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Replace the inner content of every element carrying data-cms="key" with the
// matching value from `data`. Relies on marked elements being leaves (no
// nested element sharing the same tag name) so the non-greedy match is safe.
function mergeContent(html, data) {
  const re = /<([a-z0-9]+)([^>]*\sdata-cms="([a-z0-9_.-]+)"[^>]*)>([\s\S]*?)<\/\1>/gi;
  return html.replace(re, (match, tag, attrs, key, inner) => {
    const value = resolvePath(data, key);
    if (value === undefined || value === null) return match;
    return `<${tag}${attrs}>${escapeHtml(value)}</${tag}>`;
  });
}

// Inject the editable history-timeline stages (from content/home.yml) as a
// small JSON script tag that main.js reads in preference to its built-in
// fallback array, so that content stays editable without breaking main.js
// when the script runs on a page that has no CMS data.
function injectHistoryStages(html, homeData) {
  const stages = homeData && homeData.history && homeData.history.stages;
  if (!Array.isArray(stages) || !stages.length) return html;
  const json = JSON.stringify(stages);
  const script = `<script>window.SOMA_HISTORY = ${json};</script>\n<script src="main.js"></script>`;
  return html.replace('<script src="main.js"></script>', script);
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function build() {
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const homeData = loadYaml(CONTENT_MAP['index.html']);

  for (const entry of fs.readdirSync(ROOT)) {
    if (EXCLUDE.has(entry)) continue;
    const srcPath = path.join(ROOT, entry);
    const destPath = path.join(DIST, entry);

    if (entry.endsWith('.html') && CONTENT_MAP[entry]) {
      const data = loadYaml(CONTENT_MAP[entry]);
      let html = fs.readFileSync(srcPath, 'utf8');
      html = mergeContent(html, data);
      if (entry === 'index.html') html = injectHistoryStages(html, homeData);
      fs.writeFileSync(destPath, html, 'utf8');
    } else {
      copyRecursive(srcPath, destPath);
    }
  }

  console.log('Build complete -> dist/');
}

build();
