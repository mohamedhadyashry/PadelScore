# Twofold — free title/abstract screening for systematic reviews

A free, single-file alternative to Rayyan for screening abstracts with two independent reviewers.
No account, no server, no upload: everything runs in the browser and is saved on each reviewer's own device.

Open `index.html` in any modern browser (double-click it, or host it free on GitHub Pages / Netlify).

## What it does

- **Imports CSV** exports from PubMed, Scopus, Web of Science, Embase, Rayyan, Zotero or EndNote.
  Columns are detected automatically and you can correct the mapping. Several files can be merged.
- **Finds duplicates**: same DOI, same PMID, identical title, or a similar title (spelling variants such as
  *randomised / randomized*, punctuation, small typos). You decide on every group: keep one and remove the
  copies, or mark them as different papers. Exact matches can be removed in one click. Every decision can be undone.
- **Blind screening**: title, authors, year, journal, DOI/PubMed links and the full abstract, with
  Include / Maybe / Exclude, exclusion reasons, notes, and keyword highlighting (green for inclusion words,
  red for exclusion words, both editable). Keyboard: `I` include, `E` exclude, `M` maybe, `U` clear, `J`/`K` next/previous.
- **Compare two reviewers**: agreement, Cohen's kappa (three-category, and include/exclude with maybe counted as include),
  a 3×3 agreement table, and a list of conflicts to resolve by consensus.
- **Exports**: results CSV (each reviewer's decision, reason and note, agreement, final decision),
  final includes only, removed duplicates, and PRISMA flow numbers.

## Two-reviewer workflow

1. **Lead** imports the CSVs on the *Import* tab and resolves duplicates on the *Duplicates* tab.
2. **Lead** exports the **project file** (*Export* tab) and sends it to the second reviewer (email, WhatsApp, Drive…).
   It holds the records and duplicate decisions but no screening decisions.
3. **Each reviewer** types their name at the top and screens on their own device. Nobody sees the other's decisions.
4. **Each reviewer** exports **my decisions** and sends that file to the lead.
5. **Lead** imports the decisions on the *Compare* tab, checks kappa, and resolves every conflict.

Data lives in the browser's storage (IndexedDB) on each device. Clearing site data deletes it, so export your
decisions file now and then as a backup.
