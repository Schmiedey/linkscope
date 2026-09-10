# LinkScope

Local-first Chrome extension that reads the current page, shows who else is on it, and maps connected domains as a graph.

LinkScope does **not** send data to a server. There are no accounts. It does **not** scan pages until you click.

## Load unpacked

1. Install dependencies: `npm install`
2. Start the extension build: `npm run dev`
3. Open `chrome://extensions`
4. Enable **Developer mode**
5. Click **Load unpacked**
6. Select the `.output/chrome-mv3` folder (WXT prints the exact path)

## Use it

1. Open any `http`/`https` website
2. Click the LinkScope icon — that click is the scan
3. The popup shows third-party / tracker / ad / unknown counts, and what changed since last visit
4. Click a domain for a load chain (page → iframe or script → domain) and watch/block actions
5. Press **Inspect** for the full graph, or **Watch 15 seconds** to catch delayed requests

The toolbar badge shows the third-party count, or `+N` new domains since last visit to this site.

## Permissions

- `activeTab` + `scripting` — scan the tab you clicked
- `tabs` — open the graph / dashboard and update the badge from saved scans
- `webRequest` — while a scan/watch is running, record initiator/document URLs for that tab
- `notifications` — optional local alerts when a watched domain appears elsewhere
- `declarativeNetRequest` + optional host access — only if you click **Block this domain**

No required host permissions. Pages are not injected at `document_start`.

## Development

```bash
npm run dev
npm run compile
npm run build
```
