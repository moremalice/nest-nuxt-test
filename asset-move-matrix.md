# Asset Move Matrix (Nuxt 4 migration)

This table enumerates each file under `frontend/public` (and `frontend/locales`) and the proposed destination.

| Source | Destination | Action | Notes |
|---|---|---|---|
| `frontend/public/favicon.ico` | `frontend/public/favicon.ico` | **keep** | Canonical favicon stays in public/ |
| `frontend/locales/de.json` | `frontend/app/locales/de.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/en.json` | `frontend/app/locales/en.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/es.json` | `frontend/app/locales/es.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/fr.json` | `frontend/app/locales/fr.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/id.json` | `frontend/app/locales/id.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/it.json` | `frontend/app/locales/it.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/ja.json` | `frontend/app/locales/ja.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/ko.json` | `frontend/app/locales/ko.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/pt.json` | `frontend/app/locales/pt.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/ru.json` | `frontend/app/locales/ru.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/th.json` | `frontend/app/locales/th.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/tr.json` | `frontend/app/locales/tr.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/vi.json` | `frontend/app/locales/vi.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/zh-CN.json` | `frontend/app/locales/zh-CN.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |
| `frontend/locales/zh-TW.json` | `frontend/app/locales/zh-TW.json` | **move** | Nuxt i18n v10 prefers langDir under app/ (file-based lazy loading) |