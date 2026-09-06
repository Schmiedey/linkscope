# LinkScope

Local-first Chrome extension that scans the current page, maps every connected domain as an interactive graph, and remembers those scans over time.

LinkScope does **not** send data to a server. There are no accounts.

## Load unpacked

1. Install dependencies: `npm install`
2. Start the extension build: `npm run dev`
3. Open `chrome://extensions`
4. Enable **Developer mode**
5. Click **Load unpacked**
6. Select the `.output/chrome-mv3` folder (WXT prints the exact path)

## Use it

1. Open any `http`/`https` website
2. Click the LinkScope icon
3. Press **Scan website**
4. A full-screen graph tab opens
5. Click a node to see **why it is here**
6. Open the dashboard for history and the global graph

## Permissions

- `activeTab` + `scripting` — scan only the page you clicked on
- `tabs` — open the graph / dashboard tab

No host permissions. Nothing is scanned in the background.

## Development

```bash
npm run dev
npm run compile
npm run build
```
