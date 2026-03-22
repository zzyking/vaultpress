# Troubleshooting

## Common Checks

If export fails, check these first:

- Run `bin/vaultpress --help` to confirm the CLI is linked and callable.
- Run `npm test` to make sure the local install is healthy.
- If browser launch fails, pass an explicit binary:

```bash
bin/vaultpress --browser "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
  --output out.pdf \
  note.md
```

## Debug Files

On failure, VaultPress prints the exact paths for:
- the kept temp directory
- the browser log
- the rendered HTML

If you want the rendered HTML regardless of success or failure, use:

```bash
bin/vaultpress --debug-html /tmp/vaultpress-debug.html --output out.pdf note.md
```

If you want temp files preserved even on success, use:

```bash
bin/vaultpress --keep-temp --output out.pdf note.md
```

## Known Limitations

Current limitations worth being explicit about:
- not a full Obsidian renderer
- Dataview / DataviewJS blocks are displayed, not executed
- plugin compatibility is intentionally limited
- custom themes and full Obsidian styling are not reproduced 1:1
- current PDF backend depends on a locally installed Chromium-family browser
- browser auto-detection is pragmatic, not exhaustive
