# Docs staging: `to-doc-site`

Drafts of pages for the Onboard.qs documentation site. They are written alongside the change they
describe, in the same commit, and published to the documentation site later.

Sibling projects are further along and their conventions are worth reading rather than guessing at.
[chatbox.qs's `to-doc-site/README.md`](https://github.com/ptarmiganlabs/chatbox.qs/blob/main/to-doc-site/README.md)
is the fullest version of this spec — audience, file format, draft anatomy, the `done/` convention
and the publishing loop. **Follow it.** It is not restated here, so that the two cannot drift apart;
this file exists to say where the folder came from and where the rules live.

In short:

- One Markdown file per topic, descriptive kebab-case name, written for Qlik Sense app developers
  and the administrators who install the extension.
- Add one in the same commit as any user-visible change. Skip it for refactors, tests, CI and
  dependency bumps.
- Leave new files unprefixed and directly in this folder. The move into `done/` belongs to whoever
  publishes them.
- [`README.md`](../README.md) is what a user actually reads today. A draft here does not excuse
  leaving it stale.

This folder was created by the change that gave Onboard.qs an SVG logo source and a correctly
sized asset-panel tile.
