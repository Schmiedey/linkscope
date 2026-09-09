# LinkScope

Local-first Chrome extension that reads the current page, shows a glanceable privacy label, and maps every connected domain as a graph you can open when you want to go deeper.

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
3. The popup checks the page and shows a **nutrition label**: privacy grade, third parties, trackers, and what changed since last visit
4. Click a domain for a plain-English identity and **why it is here**
5. Press **Inspect** only when you want the full graph
6. Right-click a graph node to **follow** it across sites

The toolbar badge shows third-party count, `+N` new domains since last visit, or `!` when something unusual showed up.

## Permissions

- `activeTab` + `scripting` — scan only the page you clicked on
- `tabs` — open the graph / dashboard tab and update the badge for the active site

No host permissions. Nothing is scanned until you open the popup or press the shortcut.

## Development

```bash
npm run dev
npm run compile
npm run build
```
