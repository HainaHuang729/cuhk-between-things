const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../miniprogram");
const app = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const pages = new Set(app.pages);
const scripts = ["app.js"];

function requireFile(relative) {
  assert.ok(fs.existsSync(path.join(root, relative)), `Missing file: ${relative}`);
}

for (const page of pages) {
  for (const extension of ["js", "json", "wxml", "wxss"]) requireFile(`${page}.${extension}`);
  JSON.parse(fs.readFileSync(path.join(root, `${page}.json`), "utf8"));
  const source = fs.readFileSync(path.join(root, `${page}.js`), "utf8");
  const template = fs.readFileSync(path.join(root, `${page}.wxml`), "utf8");
  for (const match of template.matchAll(/(?:bind|catch):?[\w-]+="([\w$]+)"/g)) {
    assert.match(source, new RegExp(`\\b${match[1]}\\s*\\(`), `${page}: missing handler ${match[1]}`);
  }
  scripts.push(`${page}.js`);
}

for (const tab of app.tabBar.list) {
  assert.ok(pages.has(tab.pagePath), `Unregistered tab: ${tab.pagePath}`);
  requireFile(tab.iconPath);
  requireFile(tab.selectedIconPath);
}
requireFile(app.sitemapLocation);
JSON.parse(fs.readFileSync(path.join(root, app.sitemapLocation), "utf8"));

for (const directory of ["services", "utils"]) {
  for (const name of fs.readdirSync(path.join(root, directory))) {
    if (name.endsWith(".js")) scripts.push(`${directory}/${name}`);
  }
}

for (const script of scripts) {
  const filename = path.join(root, script);
  const result = spawnSync(process.execPath, ["--check", filename], { encoding: "utf8" });
  assert.equal(result.status, 0, `${script}: ${result.stderr || result.error || "syntax check failed"}`);
  const source = fs.readFileSync(filename, "utf8");
  for (const match of source.matchAll(/require\(["'](\.[^"']+)["']\)/g)) {
    assert.ok(fs.existsSync(path.resolve(path.dirname(filename), `${match[1]}.js`)), `${script}: missing import ${match[1]}`);
  }
  for (const match of source.matchAll(/url:\s*["'`](\/pages\/[^?"'`]+)/g)) {
    assert.ok(pages.has(match[1].slice(1)), `${script}: unregistered route ${match[1]}`);
  }
  for (const match of source.matchAll(/["'](\/assets\/[^"']+)["']/g)) requireFile(match[1].slice(1));
  if (script.startsWith("pages/")) assert.ok(!source.includes("mock-store"), `${script}: use services for item data`);
}

console.log(`Checked ${pages.size} pages, ${app.tabBar.list.length} tabs and ${scripts.length} JavaScript files.`);
