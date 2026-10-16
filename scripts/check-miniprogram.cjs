const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../miniprogram");
const app = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const pages = new Set(app.pages);
const scripts = ["app.js"];
const repository = path.resolve(root, "..");
const listed = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", "miniprogram"], {
  cwd: repository,
  encoding: "utf8"
});
assert.equal(listed.status, 0, `Unable to check repository files: ${listed.stderr || listed.error || "git failed"}`);
const versionableFiles = new Set(listed.stdout.split("\0").filter(Boolean));

function requireFile(relative) {
  const filename = path.join(root, relative);
  assert.ok(fs.existsSync(filename), `Missing file: ${relative}`);
  const repositoryPath = path.relative(repository, filename).split(path.sep).join("/");
  assert.ok(versionableFiles.has(repositoryPath), `Git-ignored dependency would be absent from a clean checkout: ${repositoryPath}`);
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
    requireFile(path.relative(root, path.resolve(path.dirname(filename), `${match[1]}.js`)));
  }
  for (const match of source.matchAll(/url:\s*["'`](\/pages\/[^?"'`]+)/g)) {
    assert.ok(pages.has(match[1].slice(1)), `${script}: unregistered route ${match[1]}`);
  }
  for (const match of source.matchAll(/["'](\/assets\/[^"']+)["']/g)) requireFile(match[1].slice(1));
  if (script.startsWith("pages/")) assert.ok(!source.includes("mock-store"), `${script}: use services for item data`);
}

console.log(`Checked ${pages.size} pages, ${app.tabBar.list.length} tabs and ${scripts.length} JavaScript files.`);
