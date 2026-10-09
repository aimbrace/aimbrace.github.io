# aimbrace.github.io

The website for [AIMBRACE](https://github.com/aimbrace/aimbrace): an explainer, the agent template's plugin graph, and the documentation.

The documentation and the graph are **copied** from the framework repository by `pnpm run sync` (default source: `../aimbrace`; nothing
needs building there). The copies are committed, so the site builds on its own. Re-run the sync after changing the docs there.

```sh
pnpm install
pnpm run sync -- --source ../aimbrace   # refresh content
pnpm test                               # library tests
pnpm run dev                            # http://localhost:5173
pnpm run build                          # dist/, deployed by .github/workflows/pages.yml
```

Deploys on every push to `main` through GitHub Pages.
