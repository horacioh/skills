#!/usr/bin/env bash
# Usage: collect.sh <repo-checkout> <pr-number> [workdir]
# Writes everything build.mjs validates against: pr.diff, numstat.tsv, name-status.tsv,
# commits.txt, discussion.md (description, reviews, inline comments) and meta.json.
# Uses the SHAs GitHub recorded on the PR, so the diff matches the PR's "Files changed"
# even after the base branch has been rebased or force-pushed.
set -euo pipefail
REPO=$(cd "$1" && pwd); N=$2; OUT=${3:-$PWD/work}
mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd); cd "$REPO"
SLUG=${PR_REPO:-$(git remote get-url origin | sed -E 's|\.git$||; s|^.*github\.com[/:]||')}
gh api "repos/$SLUG/pulls/$N" > "$OUT/pr.json"
read -r BASE_TIP HEAD_SHA < <(node -e 'const p=require(process.argv[1]);console.log(p.base.sha,p.head.sha)' "$OUT/pr.json")
git fetch -q origin "pull/$N/head" "$BASE_TIP" 2>/dev/null || git fetch -q origin "pull/$N/head"
git cat-file -e "$BASE_TIP^{commit}" 2>/dev/null || git fetch -q --deepen=500 origin "pull/$N/head"
BASE_SHA=$(git merge-base "$BASE_TIP" "$HEAD_SHA")
git diff -M --no-color "$BASE_SHA" "$HEAD_SHA" > "$OUT/pr.diff"
git diff -M --numstat "$BASE_SHA" "$HEAD_SHA" > "$OUT/numstat.tsv"
git diff -M --name-status "$BASE_SHA" "$HEAD_SHA" > "$OUT/name-status.tsv"
git log --reverse --format='%h %an: %s%n%b%n---' "$BASE_SHA..$HEAD_SHA" > "$OUT/commits.txt"
gh api --paginate "repos/$SLUG/issues/$N/comments" > "$OUT/issue-comments.json"
gh api --paginate "repos/$SLUG/pulls/$N/comments" > "$OUT/review-comments.json"
gh api --paginate "repos/$SLUG/pulls/$N/reviews" > "$OUT/reviews.json"
node - "$OUT" "$BASE_SHA" <<'JS'
const fs = require('fs'); const [out, baseSha] = process.argv.slice(2); const j = f => JSON.parse(fs.readFileSync(`${out}/${f}`, 'utf8'));
const p = j('pr.json'); const rows = fs.readFileSync(`${out}/numstat.tsv`, 'utf8').trim().split('\n').filter(Boolean).map(l => l.split('\t'));
let add = 0, del = 0; for (const [a, d] of rows) { add += +a || 0; del += +d || 0; }
const meta = { repo: p.base.repo.full_name, number: p.number, title: p.title, author: p.user.login, state: p.merged_at ? 'merged' : p.state,
  head: p.head.ref, base: p.base.ref, headSha: p.head.sha, baseSha, stats: { files: rows.length, add, del } };
fs.writeFileSync(`${out}/meta.json`, JSON.stringify(meta, null, 2));
const bot = u => /\[bot\]$/.test(u.login) ? ' (bot)' : '';
let md = `# ${p.title}\n\n${p.body || '(no description)'}\n`;
for (const r of j('reviews.json')) if (r.body) md += `\n## Review by ${r.user.login}${bot(r.user)} (${r.state})\n${r.body}\n`;
for (const c of j('review-comments.json')) md += `\n## Inline on ${c.path}:${c.line ?? c.original_line} by ${c.user.login}${bot(c.user)}\n${c.diff_hunk.split('\n').slice(-4).join('\n')}\n> ${c.body.replace(/\n/g, '\n> ')}\n`;
for (const c of j('issue-comments.json')) if (!/devin-pr-monitoring-controls/.test(c.body)) md += `\n## Comment by ${c.user.login}${bot(c.user)}\n${c.body}\n`;
fs.writeFileSync(`${out}/discussion.md`, md);
JS
echo "head ${HEAD_SHA:0:9}  base(merge-base) ${BASE_SHA:0:9}  $(wc -l < "$OUT/numstat.tsv") files -> $OUT"
sort -t$'\t' -k1,1nr "$OUT/numstat.tsv" | head -60
