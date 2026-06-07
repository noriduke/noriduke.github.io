# noriduke works

Static portfolio site for works, character profiles, videos, notes, and novels.

## Local preview

```sh
python3 -m http.server 4175 --bind 127.0.0.1
```

Open locally:

- Site: `http://127.0.0.1:4175/index.html`
- Local editor: `http://127.0.0.1:4175/admin.html`

`admin.html`, `admin.css`, and `admin.js` are local-only files and are intentionally not published to GitHub Pages.

## Content

Primary content lives in `site_works.json`.

The local editor can update the JSON through the browser file picker/save flow.
