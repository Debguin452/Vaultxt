# VaulTxt

A minimal, mobile-first note vault built on top of the [StoreGit](https://storegit.pages.dev) API.  
Write notes, store them in your GitHub repo, read them back anywhere — no server needed beyond StoreGit itself.

---

## How to add your API key

Open `index.html` and look for this block near the top of the `<script>` tag:

```js
// ─────────────────────────────────────────────────────────────
//  CONFIGURATION  —  paste your StoreGit API key here
// ─────────────────────────────────────────────────────────────
const API_KEY  = 'sgk_YOUR_KEY_HERE';          // ← your key
const API_BASE = 'https://storegit.pages.dev'; // ← your StoreGit URL
// ─────────────────────────────────────────────────────────────
```

Replace `sgk_YOUR_KEY_HERE` with your real key. That's it — no build step, no `.env` file.

### Getting a key

1. Go to [storegit.pages.dev](https://storegit.pages.dev) and log in.
2. Open **Settings → Developer API → New Key**.
3. Give it a label (e.g. `VaulTxt`), leave **Allowed Origins** empty for local testing, and click **Create**.
4. Copy the `sgk_…` key shown — it is only displayed once.

> **Tip:** If you deploy VaulTxt to a domain (e.g. `https://vaultxt.example.com`), add that origin to the key's **Allowed Origins** list so the CORS restriction keeps other sites from using your key.

---

## Running the app

Because `index.html` calls the StoreGit API from a browser, any origin that serves the file will work:

### Locally (quickest)
```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```
Then open `http://localhost:8080`.

> A bare `file://` open **will not work** — browsers block cross-origin `fetch` from `file://` pages. Use any local server instead.

### Deployed (Cloudflare Pages / Netlify / GitHub Pages / etc.)
Upload the single `index.html` file. No backend, no build configuration needed.

---

## How the API calls work

All network calls are plain `fetch` inside a small `api` object at the top of the script. Here is what each method does:

| Method | Endpoint | Description |
|---|---|---|
| `api.list()` | `GET /api/files` | Returns the array of files in your active repo |
| `api.readText(name)` | `GET /api/download?name=…` | Fetches the file and returns it as a plain-text string |
| `api.upload(name, text)` | `POST /api/upload` | Encodes text as Base64 and uploads it |
| `api.delete(name, sha)` | `DELETE /api/delete` | Deletes a file by name + its Git SHA |
| `api.saveAs(name)` | `GET /api/download?name=…` | Downloads the file as a browser Save-As dialog |

Every call sends the header `X-API-Key: <your key>`. The full API reference is always at:

```
GET https://storegit.pages.dev/api/
```

---

## File structure

```
Vaultxt/
└── index.html   ← everything; no dependencies, no build step
```


---

## Supported file types

Notes are plain text. The extension you pick in the editor is cosmetic — all content is stored and retrieved as UTF-8 text.

| Extension | Icon |
|---|---|
| `.txt` | 📄 |
| `.md` | 📝 |
| `.json` | 🗂 |
| `.csv` | 📊 |
| `.log` | 📋 |
| `.yaml` | ⚙️ |
| `.sh` `.js` `.py` | 💻 🟨 🐍 |

---

## License

MIT — see `LICENSE`.
