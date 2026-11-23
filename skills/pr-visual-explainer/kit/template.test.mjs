import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

function loadTemplate(...symbols) {
  const source = fs.readFileSync(new URL('./template/app.js', import.meta.url), 'utf8');
  const window = { SPEC: { pr: { repo: 'example/repo', headSha: 'head', baseSha: 'base' } } };
  const document = {
    createElement: () => ({ children: [], append(...items) { this.children.push(...items); } }),
    documentElement: { classList: { add() {} } },
  };
  vm.runInNewContext(source.replace('window.__booted = boot();', `window.probe = { ${symbols.join(', ')} };`), {
    window, document, location: { search: '' }, URLSearchParams,
  });
  return window.probe;
}

test('file links keep literal quotes and hash signs in the filename', () => {
  const { renderFiles, refUrl } = loadTemplate('renderFiles', 'refUrl');
  const result = renderFiles({ areas: [{ files: [{ path: 'docs/café "notes"#L2.md', add: 0, del: 1, status: 'removed' }] }] });
  const row = result.children[0].children[0].innerHTML;
  assert.match(row, /href="https:\/\/github\.com\/example\/repo\/blob\/base\/docs\/caf%C3%A9%20%22notes%22%23L2\.md"/);
  assert.equal(refUrl('base:docs/café "notes".md#L2-L4'), 'https://github.com/example/repo/blob/base/docs/caf%C3%A9%20%22notes%22.md#L2-L4');
});

test('direct video focus and tour-step focus select the same nodes and edges', () => {
  const { focusSets } = loadTemplate('focusSets');
  const block = { edges: [{ from: 'one', to: 'two' }, { from: 'two', to: 'three' }] };
  const focus = ['one', 'two'];
  const direct = focusSets(block, focus);
  const tour = focusSets(block, { focus });
  assert.deepEqual([...direct.nodes], focus);
  assert.equal(direct.edges.size, 1);
  assert.deepEqual([...direct.edges], [...tour.edges]);
});
