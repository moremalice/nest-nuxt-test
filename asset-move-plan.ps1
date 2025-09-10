# PowerShell move plan (run from repo root)
$ErrorActionPreference = 'Stop'
# --- Pre-checks ---------------------------------------------------------------
# 1) Ensure we are inside a git repository
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Not inside a Git repository. Run this from the repo root (where 'frontend/' and 'backend/' exist)."
  exit 1
}

# 2) Switch/create work branch (quietly)
git show-ref --verify --quiet "refs/heads/nuxt4/assets-move"
if ($LASTEXITCODE -eq 0) {
  git checkout "nuxt4/assets-move"
} else {
  git checkout -b "nuxt4/assets-move"
}

New-Item -ItemType Directory -Force -Path 'frontend/app/locales' | Out-Null
git mv -f 'frontend/locales/de.json' 'frontend/app/locales/de.json'
git mv -f 'frontend/locales/en.json' 'frontend/app/locales/en.json'
git mv -f 'frontend/locales/es.json' 'frontend/app/locales/es.json'
git mv -f 'frontend/locales/fr.json' 'frontend/app/locales/fr.json'
git mv -f 'frontend/locales/id.json' 'frontend/app/locales/id.json'
git mv -f 'frontend/locales/it.json' 'frontend/app/locales/it.json'
git mv -f 'frontend/locales/ja.json' 'frontend/app/locales/ja.json'
git mv -f 'frontend/locales/ko.json' 'frontend/app/locales/ko.json'
git mv -f 'frontend/locales/pt.json' 'frontend/app/locales/pt.json'
git mv -f 'frontend/locales/ru.json' 'frontend/app/locales/ru.json'
git mv -f 'frontend/locales/th.json' 'frontend/app/locales/th.json'
git mv -f 'frontend/locales/tr.json' 'frontend/app/locales/tr.json'
git mv -f 'frontend/locales/vi.json' 'frontend/app/locales/vi.json'
git mv -f 'frontend/locales/zh-CN.json' 'frontend/app/locales/zh-CN.json'
git mv -f 'frontend/locales/zh-TW.json' 'frontend/app/locales/zh-TW.json'
git add -A
git commit -m "chore(nuxt4): move assets from public -> app/assets, locales -> app/locales; dedupe favicon; rename _robots.txt"