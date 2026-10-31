# Ritual Archive for Terraria: website

A static site (no build step) for GitHub Pages: an overview (`index.html`), the rules (`rules.html`) and a searchable
technique reference (`techniques.html`).

The technique, class and feat text comes from the mod's source, so regenerate the data after changing the mod:

```
python -I docs/tools/site-extract.py <path to ModSources/JJKTechniques> docs/site/data/data.json
```

`assets/describe.js` is a port of `Common/Describe.cs` (how the book turns archive text into Terraria numbers).
Keep the two in step when either changes.

To preview locally, serve this folder (opening the files directly won't load the data):

```
python -m http.server 8765 --directory docs/site
```
