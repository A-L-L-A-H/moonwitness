# Media

This directory is the intended home for visual and audiovisual CRAYON assets.

```text
media/
  opener/
  posters/
    allah/
    human/
    nature/
    justice/
  audio/
  video/
```

Large files are configured for Git LFS in `.gitattributes`.

The current GitHub connector can commit repository text directly, but the generated binary media should be transferred through a Git LFS-capable Git client so the repository history does not become a large binary store.

See `MANIFEST.md` for the canonical filenames and mapping.
