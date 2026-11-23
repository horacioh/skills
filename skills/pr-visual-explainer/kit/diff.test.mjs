import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diffRows, parseDiff } from './diff.mjs';

test('reads paths from Git file headers and keeps header-like rows inside hunks', () => {
  const patch = String.raw`diff --git "a/old.md" "b/caf\303\251 \"notes\".md"
--- a/old.md
+++ "b/caf\303\251 \"notes\".md"
@@ -1,2 +1,2 @@
--- count;
+++ count;
 tail();
diff --git a/dir/space b/name.md b/dir/space b/name.md
--- a/dir/space b/name.md` + '\t\n+++ /dev/null\n@@ -1 +0,0 @@\n-deleted\n';
  const files = parseDiff(patch);
  assert.deepEqual([...files.keys()], ['café "notes".md', 'dir/space b/name.md']);
  assert.deepEqual(files.get('café "notes".md').hunks[0].lines, ['--- count;', '+++ count;', ' tail();']);
  assert.deepEqual(files.get('dir/space b/name.md').hunks[0].lines, ['-deleted']);
});

test('verbatim rows are indexed by both source line positions without trimming context', () => {
  const file = parseDiff('diff --git a/a.js b/a.js\n--- a/a.js\n+++ b/a.js\n@@ -4,2 +7,2 @@\n  keep();\n-old();\n+new();').get('a.js');
  assert.deepEqual([...diffRows(file)], [['4:7', '  keep();'], ['5:8', '-old();'], ['6:8', '+new();']]);
});
