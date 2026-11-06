# Changelog

## [1.9.0](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.8.2...onboard-qs-v1.9.0) (2026-11-06)

### Features

- Add GitNexus documentation and CLI skills for code intelligence ([0232323](https://github.com/ptarmiganlabs/onboard.qs/commit/0232323c7fb8b66a8c15c5b44ae378a2ca526716))
- add Lui icon support to the Onboard.qs start button ([9bf16bd](https://github.com/ptarmiganlabs/onboard.qs/commit/9bf16bd93f3e6954960fc689fdfe914a83bc287e))
- add project-wide todo list section to AGENTS.md for follow-up items ([d62a29e](https://github.com/ptarmiganlabs/onboard.qs/commit/d62a29e5a1471a04d5f977b0a10f0546bd504619))
- Add SBOM creation to build process ([4bb9091](https://github.com/ptarmiganlabs/onboard.qs/commit/4bb90911ca22edcb89122e70f1cec8ff3e041a4b))
- Improve build stability and security by upgrading CI and agentic workflows ([495fde8](https://github.com/ptarmiganlabs/onboard.qs/commit/495fde816a52d3b87f66b1a67f4fe04fae92f95b))
- replace buttonIcon text input with curated Lui icon dropdown ([102393b](https://github.com/ptarmiganlabs/onboard.qs/commit/102393bad59ae68cd48646967b0e2308cc98dad0))
- **tour:** make the progress text configurable per tour ([9f2324b](https://github.com/ptarmiganlabs/onboard.qs/commit/9f2324b0b6c1fe195db5d95f388d94904e2db531)), closes [#282](https://github.com/ptarmiganlabs/onboard.qs/issues/282)
- **tour:** optionally update tour expressions at each step ([3b9d75e](https://github.com/ptarmiganlabs/onboard.qs/commit/3b9d75ea45c7d388c1e0bec1c384e0899e8121ee)), closes [#280](https://github.com/ptarmiganlabs/onboard.qs/issues/280)
- **tour:** update the open step when selections change during a tour ([4bff330](https://github.com/ptarmiganlabs/onboard.qs/commit/4bff330a29b4b5f8ce113df95d949c587129b3c5))

### Bug Fixes

- Add missing permissions section and update checkout action version ([23fb7dc](https://github.com/ptarmiganlabs/onboard.qs/commit/23fb7dc43019d43d72cf1dd1f37d54d1e92fd962))
- escapeAttr for aria-label injection; wrap no-icon label in span for flex gap ([01c2522](https://github.com/ptarmiganlabs/onboard.qs/commit/01c2522cc20e4ac68cbcc950e71ed6415c89e27c))
- **logo:** redraw the mark as SVG and re-render preview.png at 280 ([eb5f899](https://github.com/ptarmiganlabs/onboard.qs/commit/eb5f899709aebe47f613aa19051f28c8b9daefd1))
- **tour:** auto-start each tour once per sheet visit ([5584eef](https://github.com/ptarmiganlabs/onboard.qs/commit/5584eef80a6ab0b953e3223b502f7c5d79025bdb)), closes [#285](https://github.com/ptarmiganlabs/onboard.qs/issues/285)
- **tour:** close a tour when the user leaves its sheet ([57fa374](https://github.com/ptarmiganlabs/onboard.qs/commit/57fa374d877318cb817a618aadbb929ddec4dd9b)), closes [#285](https://github.com/ptarmiganlabs/onboard.qs/issues/285)
- **tour:** describe dialog sizes for every step type and share the presets ([ca3e17e](https://github.com/ptarmiganlabs/onboard.qs/commit/ca3e17e3d63f9c4c37c8d8835601cc79b9cb3e76))
- **tour:** keep a stage padding or radius of 0 ([5e0a267](https://github.com/ptarmiganlabs/onboard.qs/commit/5e0a2679627cbe783d130690bb70416430ebe22a))
- **tour:** keep Qlik expressions intact when importing tours ([bb89c97](https://github.com/ptarmiganlabs/onboard.qs/commit/bb89c97f0fab93031a338146f2b76abb9c93f007))
- **tour:** point the default sample tour at stable top-bar hooks ([d44ec38](https://github.com/ptarmiganlabs/onboard.qs/commit/d44ec3892ffb620a5311d00b1cfea591191a8193))
- **tour:** track auto-start visits per sheet and re-check before driving ([415a11d](https://github.com/ptarmiganlabs/onboard.qs/commit/415a11d231adfeff2ffafe61ba9e6a5def7d6e0b)), closes [#285](https://github.com/ptarmiganlabs/onboard.qs/issues/285)

### Miscellaneous

- **dependabot:** ignore github/gh-aw-actions by its bare name too ([a78737d](https://github.com/ptarmiganlabs/onboard.qs/commit/a78737d3be512f923f3506e034d67dc5cb43a137))
- **deps-dev:** align [@nebula](https://github.com/nebula).js/cli and cli-build on 7.9.0 ([c7c2568](https://github.com/ptarmiganlabs/onboard.qs/commit/c7c2568113d3698746438476dba7ee13e6027c95))
- **deps-dev:** bump @cyclonedx/cyclonedx-npm from 4.2.1 to 5.0.0 ([7617d61](https://github.com/ptarmiganlabs/onboard.qs/commit/7617d61bedf066756d50f349de1e93cdbe5049bc))
- **deps-dev:** bump @cyclonedx/cyclonedx-npm from 5.0.0 to 6.0.0 ([3c56c87](https://github.com/ptarmiganlabs/onboard.qs/commit/3c56c873aa5b5a5ce24d691f93d3beebd9738696))
- **deps-dev:** bump @humanfs/node from 0.16.7 to 0.16.8 ([2bbc5f6](https://github.com/ptarmiganlabs/onboard.qs/commit/2bbc5f654a9d05ca758955c376974e810c7d5c1a))
- **deps-dev:** bump browserslist from 4.28.1 to 4.28.9 ([0bde251](https://github.com/ptarmiganlabs/onboard.qs/commit/0bde251eebdc27d97e3e14dfdfe2c727fcf86c4e))
- **deps-dev:** bump esbuild from 0.28.0 to 0.28.1 ([29614b7](https://github.com/ptarmiganlabs/onboard.qs/commit/29614b768b610f6de7750ca248515966cabb6e6a))
- **deps-dev:** bump eslint-plugin-jsdoc from 63.0.0 to 63.0.2 ([3b61cbe](https://github.com/ptarmiganlabs/onboard.qs/commit/3b61cbe3044a023b4712706f20847461c5eefa3e))
- **deps-dev:** bump fast-uri from 3.1.0 to 3.1.2 ([1bdd1af](https://github.com/ptarmiganlabs/onboard.qs/commit/1bdd1afb8bfa4756a8fd485b17639e0bc877743e))
- **deps-dev:** bump fast-uri from 3.1.2 to 3.1.7 ([99c1cc9](https://github.com/ptarmiganlabs/onboard.qs/commit/99c1cc97f34c473ee6fc57c1792c2538b310d88f))
- **deps-dev:** bump fast-uri from 3.1.7 to 3.1.9 ([b6b18f9](https://github.com/ptarmiganlabs/onboard.qs/commit/b6b18f962f0215fdaebae66b94626e0942da3d77))
- **deps-dev:** bump ip-address from 10.2.0 to 10.4.0 ([85a9ecd](https://github.com/ptarmiganlabs/onboard.qs/commit/85a9ecd18a732213ecec89e0f8a2a2195b227e4e))
- **deps-dev:** bump lint-staged from 17.0.5 to 17.0.7 ([d698f24](https://github.com/ptarmiganlabs/onboard.qs/commit/d698f24b9f29e168883836474f594f4c86720d11))
- **deps-dev:** bump lint-staged from 17.0.7 to 17.6.0 ([93da1df](https://github.com/ptarmiganlabs/onboard.qs/commit/93da1df80046a91eb3e93372089faf4b41e47bb6))
- **deps-dev:** bump prettier from 3.8.3 to 3.8.4 ([e5fec94](https://github.com/ptarmiganlabs/onboard.qs/commit/e5fec94260f7d22d2479ca302417279eaffb6aef))
- **deps-dev:** bump tar from 7.5.15 to 7.5.22 ([ebaf11f](https://github.com/ptarmiganlabs/onboard.qs/commit/ebaf11f4f2f70963ceea4e3881fb1ebd5d6b348e))
- **deps-dev:** hold transitive versions to the 7-day cooldown ([3c6a59d](https://github.com/ptarmiganlabs/onboard.qs/commit/3c6a59d78b63e81e2f4a32ac705caa0a67b985ed))
- **deps-dev:** update vulnerable transitive dev dependencies ([4b33af4](https://github.com/ptarmiganlabs/onboard.qs/commit/4b33af42b304596f4388d362596395ef44f1e46a))
- **deps:** bump @babel/core and [@nebula](https://github.com/nebula).js/cli-sense ([c93260b](https://github.com/ptarmiganlabs/onboard.qs/commit/c93260b140b3c7f7cb22d2e9264ec9657d64fdaf))
- **deps:** bump actions/cache/save from 5.0.5 to 6.1.0 ([76605c1](https://github.com/ptarmiganlabs/onboard.qs/commit/76605c12247ec1fd2048c3726fdc4df87f09fa21))
- **deps:** bump actions/checkout from 6.0.2 to 7.0.0 ([a9f0df8](https://github.com/ptarmiganlabs/onboard.qs/commit/a9f0df81f3e2797d0ce40c6e5454f783e4a3e3e5))
- **deps:** bump actions/checkout from 7.0.0 to 7.0.1 ([5e3fbdd](https://github.com/ptarmiganlabs/onboard.qs/commit/5e3fbdddb76bcdbec4068f2550c739b9e87d4fe5))
- **deps:** bump actions/github-script from 8.0.0 to 9.0.0 ([7feb6f5](https://github.com/ptarmiganlabs/onboard.qs/commit/7feb6f5933dd4a3a8499237bbb025d98ef176b19))
- **deps:** bump actions/upload-artifact from 7.0.0 to 7.0.1 ([03ef37a](https://github.com/ptarmiganlabs/onboard.qs/commit/03ef37a242e0dae0fa346f5205d98006de39b77e))
- **deps:** bump astral-sh/setup-uv from 8.1.0 to 8.2.0 ([493527c](https://github.com/ptarmiganlabs/onboard.qs/commit/493527c66a5d6b933e39480f835653656d8a99ab))
- **deps:** bump astral-sh/setup-uv from 8.2.0 to 10.3.3 ([4d9ac6b](https://github.com/ptarmiganlabs/onboard.qs/commit/4d9ac6b546093e688c70486dc48d609525036470))
- **deps:** bump basic-ftp from 5.2.0 to 5.2.2 ([e64bef6](https://github.com/ptarmiganlabs/onboard.qs/commit/e64bef6da576a994ffe3aa3d6c209edca2b6fdb4))
- **deps:** bump brace-expansion ([b5f4d60](https://github.com/ptarmiganlabs/onboard.qs/commit/b5f4d60ecf776617a736bed2c6c429cf71c53c7a))
- **deps:** bump dompurify from 3.4.13 to 3.4.17 ([2f2c5f9](https://github.com/ptarmiganlabs/onboard.qs/commit/2f2c5f90708eb3f4b57ec424f153709dec0f1101))
- **deps:** bump dompurify from 3.4.7 to 3.4.13 ([9f300ea](https://github.com/ptarmiganlabs/onboard.qs/commit/9f300eae71f6ca8bc2d1764f4481a2539de1bfeb))
- **deps:** bump follow-redirects from 1.15.11 to 1.16.0 ([d7803d9](https://github.com/ptarmiganlabs/onboard.qs/commit/d7803d929e073506cd210a41f6a8b3310b1a33a5))
- **deps:** bump follow-redirects from 1.16.0 to 1.16.2 ([8e86aa9](https://github.com/ptarmiganlabs/onboard.qs/commit/8e86aa905e1740c30b7789b20fdede98da35f0bd))
- **deps:** bump github/codeql-action from 4.35.1 to 4.35.2 ([3fd1b79](https://github.com/ptarmiganlabs/onboard.qs/commit/3fd1b7942eedf704e88a9f51845ee88e137ac334))
- **deps:** bump github/codeql-action from 4.35.5 to 4.36.0 ([b84d61e](https://github.com/ptarmiganlabs/onboard.qs/commit/b84d61ed9970bc88937a027e08e3f0734c7499b3))
- **deps:** bump github/codeql-action from 4.36.0 to 4.36.2 ([87cc1a0](https://github.com/ptarmiganlabs/onboard.qs/commit/87cc1a00ec4a81dcbbb2fd55f410efa52fee8481))
- **deps:** bump github/codeql-action/analyze from 4.36.2 to 4.39.1 ([8acc817](https://github.com/ptarmiganlabs/onboard.qs/commit/8acc817203e24feba4770eb8c726f23ed224203f))
- **deps:** bump github/codeql-action/init from 4.36.2 to 4.39.1 ([23ffc05](https://github.com/ptarmiganlabs/onboard.qs/commit/23ffc0598762802c9eed6c697f3cbcacef54394e))
- **deps:** bump github/gh-aw from 0.65.0 to 0.68.3 ([2b0bcde](https://github.com/ptarmiganlabs/onboard.qs/commit/2b0bcde7b7ff0ba9128591a5bba26d5e4d51eb49))
- **deps:** bump googleapis/release-please-action from 4.4.0 to 4.4.1 ([534def6](https://github.com/ptarmiganlabs/onboard.qs/commit/534def675e9bf1f3313d21c25bc953cf341123ea))
- **deps:** bump ip-address from 10.1.0 to 10.2.0 ([f14cd7a](https://github.com/ptarmiganlabs/onboard.qs/commit/f14cd7a77b956e6ef0f4b7f56f1fe9900b65b18f))
- **deps:** bump launch-editor from 2.14.0 to 2.14.1 ([47d375d](https://github.com/ptarmiganlabs/onboard.qs/commit/47d375dab8a062450bcf3d02891710dcc4686910))
- **deps:** bump postcss from 8.5.15 to 8.5.25 ([e3ad96a](https://github.com/ptarmiganlabs/onboard.qs/commit/e3ad96abe327081972948812c34219e1b0e8bbcb))
- **deps:** bump postcss from 8.5.8 to 8.5.10 ([dee5a1a](https://github.com/ptarmiganlabs/onboard.qs/commit/dee5a1a741ab31a08f9875cd396c0869f515a070))
- **deps:** bump postcss-selector-parser ([b799701](https://github.com/ptarmiganlabs/onboard.qs/commit/b799701f8e0843caaf244e2fc90f8bef206f5910), [f978858](https://github.com/ptarmiganlabs/onboard.qs/commit/f97885895fab46abe6eccf857839662648b52b06))
- **deps:** bump qs and express ([43bf2ad](https://github.com/ptarmiganlabs/onboard.qs/commit/43bf2ad03c4a7d570209ac2027393675b0406b8e))
- **deps:** bump serialize-javascript from 7.0.5 to 7.1.4 ([06da407](https://github.com/ptarmiganlabs/onboard.qs/commit/06da407eea13ed7c48b88467f20c5e54337bedcf))
- **deps:** bump shell-quote from 1.8.4 to 1.10.0 ([a7facf5](https://github.com/ptarmiganlabs/onboard.qs/commit/a7facf559d9ba3b76779ad8ff2b0a58023cca8ae))
- **deps:** bump svgo from 2.8.2 to 2.8.3 ([755761b](https://github.com/ptarmiganlabs/onboard.qs/commit/755761bc682e0bc1b627f5cb6dc77a3141a50fda))
- **deps:** bump the remaining codeql-action and cache sub-actions ([90abf49](https://github.com/ptarmiganlabs/onboard.qs/commit/90abf49796e6df742e50447758aa5dceb6f5e8da))
- **deps:** bump uuid and [@nebula](https://github.com/nebula).js/cli-serve ([6d77c26](https://github.com/ptarmiganlabs/onboard.qs/commit/6d77c2648bbc3a0f26ccf6d261bc35bbcbd35627))
- **deps:** bump webpack-dev-server and [@nebula](https://github.com/nebula).js/cli-serve ([afed926](https://github.com/ptarmiganlabs/onboard.qs/commit/afed92687d46d5c21eb0d24c76e0510c3d936192))
- **deps:** bump websocket-driver from 0.7.4 to 0.7.5 ([b21dfb9](https://github.com/ptarmiganlabs/onboard.qs/commit/b21dfb9581ec5407c28a8f5bbde18c98427ad0b0))
- pin Node 24.22.1 for the 2026-10-21 security release ([8309a92](https://github.com/ptarmiganlabs/onboard.qs/commit/8309a924af581c5abd504beb220cc5d796df5d19))
- tag each release when release-please creates its draft ([9ea26ee](https://github.com/ptarmiganlabs/onboard.qs/commit/9ea26eec2cd72e5999fb6d63e9bdf506f6e7582b))
- **tour:** add tests for moving between tour steps ([1589504](https://github.com/ptarmiganlabs/onboard.qs/commit/1589504371e4283c02e2dd11fcd71737bcee8fd7))
- update dependencies to latest versions ([0485478](https://github.com/ptarmiganlabs/onboard.qs/commit/0485478ba9c0aae1118c60d0da8d692df4f004c4))
- update eslint to version 10.4.1 in package.json and package-lock.json ([70d7a01](https://github.com/ptarmiganlabs/onboard.qs/commit/70d7a0197d8769d858ab042d7f491670cd8ea3cf))
- Upgrade extension to build using Node 24 ([9c24caf](https://github.com/ptarmiganlabs/onboard.qs/commit/9c24caf6aadada4f0509db87048cb6dd3ca75b73))

### Refactoring

- modify zip-extension script to use new archiver API ([9c24caf](https://github.com/ptarmiganlabs/onboard.qs/commit/9c24caf6aadada4f0509db87048cb6dd3ca75b73))

### Documentation

- add the demo apps and a tutorial that walks through them ([19f3334](https://github.com/ptarmiganlabs/onboard.qs/commit/19f33345331f860c6fa2e4f2240a10778b706b34))
- drop the to-doc-site draft for the logo change ([210e65e](https://github.com/ptarmiganlabs/onboard.qs/commit/210e65e8f2dbf14bd8039e211b84c47de6170240))
- point the demo apps' toolbar steps at data-tid hooks ([bd9e62b](https://github.com/ptarmiganlabs/onboard.qs/commit/bd9e62b368499fc626e557c3361b78221d99805e))
- replace the README's stale Bookmarks button selector ([798fc4a](https://github.com/ptarmiganlabs/onboard.qs/commit/798fc4ac1c94fb52121e58b57c4da323036e3c5e))
- **tour:** correct how a running tour can outlive its sheet ([2be8965](https://github.com/ptarmiganlabs/onboard.qs/commit/2be8965ebde29fffe107813cd2e6a23004380c21)), closes [#285](https://github.com/ptarmiganlabs/onboard.qs/issues/285)
- warn about auto-start restarts in the demo app tutorial ([211563e](https://github.com/ptarmiganlabs/onboard.qs/commit/211563e2e98a1cfe48fccc3ed74df67dabc421a8))

## [1.8.2](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.8.1...onboard-qs-v1.8.2) (2026-04-08)

### Bug Fixes

- remove README.pdf from extension zip file ([a403c35](https://github.com/ptarmiganlabs/onboard.qs/commit/a403c352c5bb12ba5bf123110636dab892db2a56))

## [1.8.1](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.8.0...onboard-qs-v1.8.1) (2026-04-08)

### Bug Fixes

- revert inner zip versioned naming, keep stable onboard-qs.zip ([940c815](https://github.com/ptarmiganlabs/onboard.qs/commit/940c8151e80f1fac8b8a77649fd1ef80ba6aec09))
- update release asset ZIP file naming and README instructions for versioning ([13cac93](https://github.com/ptarmiganlabs/onboard.qs/commit/13cac93bcd674497e297721da437766c8fb1524a))

### Miscellaneous

- update dependencies to latest versions ([8ac47be](https://github.com/ptarmiganlabs/onboard.qs/commit/8ac47beba2dd09d2ec3fbd5caed18514d1e71885))

## [1.8.0](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.7.0...onboard-qs-v1.8.0) (2026-04-02)

### Features

- add build date display to About modal ([d563fe8](https://github.com/ptarmiganlabs/onboard.qs/commit/d563fe8edb49a46a39eb62f4e37869edc7aff7b3)), closes [#115](https://github.com/ptarmiganlabs/onboard.qs/issues/115)
- add build date/time to About section and About dialog ([ab370f6](https://github.com/ptarmiganlabs/onboard.qs/commit/ab370f6c8ff38130006ef2610dba7a1852b5d1ad))
- add build date/time to About section and About dialog ([9d8d2f1](https://github.com/ptarmiganlabs/onboard.qs/commit/9d8d2f15a7e0c1ee3c1df550106c040f792b73b7))
- add clone/duplicate buttons for tours and steps in modal tour editor ([9840471](https://github.com/ptarmiganlabs/onboard.qs/commit/9840471e4114e2229044610f231ff9511ed575ea))
- add Markdown keyboard shortcuts, formatting toolbar, and preview ([41d4689](https://github.com/ptarmiganlabs/onboard.qs/commit/41d4689b16527b5f8fc4388fde87613df0c32ae2))
- add optional toolbar button for starting tours ([259348a](https://github.com/ptarmiganlabs/onboard.qs/commit/259348ac721f070191693cd389811856fabd3b0d))
- Add support for multiple Onboard.qs objects on same app sheet ([c83929a](https://github.com/ptarmiganlabs/onboard.qs/commit/c83929af3e5be5299412ce93cf7c9116a05f7925))
- Add support for tab containers in tour steps ([2844a26](https://github.com/ptarmiganlabs/onboard.qs/commit/2844a265ef51d2bfb5e1e40d27536b8953b9d455)), closes [#145](https://github.com/ptarmiganlabs/onboard.qs/issues/145)
- enable duplication of tours and tour steps in modal tour editor dialog ([bf03cc9](https://github.com/ptarmiganlabs/onboard.qs/commit/bf03cc98208b2c0ac517fc3e029d8e87ef0f7eca))
- enable moving of tours and tour steps in property panel ([2e39a1d](https://github.com/ptarmiganlabs/onboard.qs/commit/2e39a1ddeac704d5551596d2f5f45eb12b59db03))
- enable video embedding in tour step dialogs ([b7d5f30](https://github.com/ptarmiganlabs/onboard.qs/commit/b7d5f30b0096dfa9be063330f42295ced51b5b55))
- enable video embedding in tour step dialogs ([c92c76b](https://github.com/ptarmiganlabs/onboard.qs/commit/c92c76b16bbc162d0a5511ddfd4739871542420b))
- include README.md and PDF version in distribution ZIP ([5b08250](https://github.com/ptarmiganlabs/onboard.qs/commit/5b08250c5cf2b94a41f3e3c1c4a078dbb7fcd93c))
- **security:** Security review and associated fixes ([6072a81](https://github.com/ptarmiganlabs/onboard.qs/commit/6072a8149073b711e7516aaba494602dc86aeaec))

### Bug Fixes

- address code review feedback for toolbar injector ([ab29552](https://github.com/ptarmiganlabs/onboard.qs/commit/ab29552ff5b8b0edb82b854d21099a893f4e41e1))
- address review comments on tab container support ([d0c4030](https://github.com/ptarmiganlabs/onboard.qs/commit/d0c4030b8e04b4903efec1710c581d8772d91fed))
- align panel header heights in tour editor ([40134e5](https://github.com/ptarmiganlabs/onboard.qs/commit/40134e5fabd8e6e5bda0675ad099db7722d872a8))
- gracefully skip missing doc files in zip script with warning ([d428d53](https://github.com/ptarmiganlabs/onboard.qs/commit/d428d5320d45ec18bae71767ec21bc73dc2f4b3e))
- remove deprecated frameborder from docs and DOMPurify config ([76ffa10](https://github.com/ptarmiganlabs/onboard.qs/commit/76ffa10eca4b651d3868b1931d10f2f1e6745669))
- wrap Dollar Sign Expansion expressions in qStringExpression format when saving from tour editor ([78b8f25](https://github.com/ptarmiganlabs/onboard.qs/commit/78b8f2506ebf5ff92818669cd7ec19b85df84c0d))

### Miscellaneous

- **deps-dev:** bump eslint-plugin-jsdoc from 62.8.0 to 62.8.1 ([8bbf08d](https://github.com/ptarmiganlabs/onboard.qs/commit/8bbf08d9e6fa847d8d42063c9802456f54100d8a))
- **deps-dev:** bump eslint-plugin-jsdoc from 62.8.0 to 62.8.1 ([697ecb4](https://github.com/ptarmiganlabs/onboard.qs/commit/697ecb43d76bfef9a5efc8d4e7fc0335a190d623))
- **deps-dev:** bump lint-staged from 16.3.4 to 16.4.0 ([11602f6](https://github.com/ptarmiganlabs/onboard.qs/commit/11602f643d05ba0b6324b885953b28cd738a75eb))
- **deps-dev:** bump lint-staged from 16.3.4 to 16.4.0 ([0d22084](https://github.com/ptarmiganlabs/onboard.qs/commit/0d22084c76f6433d37846afd0d28d3bf264ea0bf))
- **deps:** bump actions/download-artifact from 8.0.0 to 8.0.1 ([90cab5c](https://github.com/ptarmiganlabs/onboard.qs/commit/90cab5ccac718bd5febb5f00c0765305453f85d1))
- **deps:** bump actions/download-artifact from 8.0.0 to 8.0.1 ([6030412](https://github.com/ptarmiganlabs/onboard.qs/commit/60304127fadb0a7c2843771b52e19fa32b946143))
- **deps:** bump github/codeql-action from 4.32.6 to 4.33.0 ([ad7de0c](https://github.com/ptarmiganlabs/onboard.qs/commit/ad7de0cd7fedfb292ad3f770e6faccd9bbe0f9df))
- **deps:** bump github/codeql-action from 4.32.6 to 4.33.0 ([020a715](https://github.com/ptarmiganlabs/onboard.qs/commit/020a71579269eca0a1815ea2ad9c400d558ba137))
- **deps:** bump github/codeql-action from 4.33.0 to 4.35.1 ([855ecc6](https://github.com/ptarmiganlabs/onboard.qs/commit/855ecc674550dccb28574834c81635bcbb99d1df))
- **deps:** bump github/codeql-action from 4.33.0 to 4.35.1 ([19eb8d2](https://github.com/ptarmiganlabs/onboard.qs/commit/19eb8d2fd81d029ad8df69832a630fe1f71e2fe9))
- **deps:** bump github/gh-aw from 0.51.2 to 0.59.0 ([d6d4109](https://github.com/ptarmiganlabs/onboard.qs/commit/d6d410953d4900b63e68cc0df96820d134c9b3e2))
- **deps:** bump github/gh-aw from 0.51.2 to 0.59.0 ([6a23c9b](https://github.com/ptarmiganlabs/onboard.qs/commit/6a23c9b4a1523c1dbb2d111fdea4031590582aa0))
- **deps:** bump github/gh-aw from 0.59.0 to 0.65.0 ([2cae868](https://github.com/ptarmiganlabs/onboard.qs/commit/2cae868603aa09c339f75d7247f9276e50c80867))
- **deps:** bump github/gh-aw from 0.59.0 to 0.65.0 ([6e02236](https://github.com/ptarmiganlabs/onboard.qs/commit/6e022360efe35dd8b990618cb1985573f5f6905a))
- **deps:** bump ncipollo/release-action from 1.20.0 to 1.21.0 ([5db3bf6](https://github.com/ptarmiganlabs/onboard.qs/commit/5db3bf6c0bbbd515d044b382e0468177ac5de0bd))
- **deps:** bump ncipollo/release-action from 1.20.0 to 1.21.0 ([7868ce4](https://github.com/ptarmiganlabs/onboard.qs/commit/7868ce402ce942f0e5ff08516dc6bc7402dea8d0))
- **deps:** update dependencies to stay safe and secure ([3b01ca4](https://github.com/ptarmiganlabs/onboard.qs/commit/3b01ca46761388e0d176969c7d534e9fa0fe3a26))
- Force workflows to use Node24 ([be5cf9a](https://github.com/ptarmiganlabs/onboard.qs/commit/be5cf9a42e2cc82e93d9a176050899782c049788))
- update nebula.js dependencies and eslint versions ([2143b35](https://github.com/ptarmiganlabs/onboard.qs/commit/2143b35de6d5a537c4d79dc9263cdc443d3d599d))

### Refactoring

- add file existence checks before adding docs to ZIP archive ([986901b](https://github.com/ptarmiganlabs/onboard.qs/commit/986901b511ffe34588e759f983303dd17ac4ca91))
- remove duplicated formatting logic from markdown-toolbar ([8dc33d5](https://github.com/ptarmiganlabs/onboard.qs/commit/8dc33d5928a249303f17e6f1ac1dde8c6b951fa3))

### Documentation

- add sponsorship section and contribution guidelines to README.md ([d967277](https://github.com/ptarmiganlabs/onboard.qs/commit/d9672778330ac17cd8ae575fa415fa2ff489b579))
- document **BUILD_DATE** compile-time constant ([a638a02](https://github.com/ptarmiganlabs/onboard.qs/commit/a638a026de76272725216eccdca94582052be345))
- document **BUILD_DATE** compile-time constant and build-date.cjs script ([673ca90](https://github.com/ptarmiganlabs/onboard.qs/commit/673ca907c58e562d8a9cc280381131f942709ba0))
- update Qlik Sense Enterprise prerequisites to November 2025 ([39491ca](https://github.com/ptarmiganlabs/onboard.qs/commit/39491cac90d4b27844f13d03a298cd060e525ba4))

## [1.7.0](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.6.0...onboard-qs-v1.7.0) (2026-03-15)

### Features

- add button width and height (%) properties for flexible sizing ([2872bce](https://github.com/ptarmiganlabs/onboard.qs/commit/2872bcefcbba02c78b00fc8901b614c691721005))
- add button width/height (%) properties for flexible sizing ([ce304c8](https://github.com/ptarmiganlabs/onboard.qs/commit/ce304c80af41970439d8a712f201191f41e606d3))
- add conditional, independent show/hide of tours and steps ([2cbea49](https://github.com/ptarmiganlabs/onboard.qs/commit/2cbea49032ade24ad6afeae502de1da2d0c3ebfb))
- add expression: 'optional' to all string and integer property panel fields ([9890106](https://github.com/ptarmiganlabs/onboard.qs/commit/98901066b7186fa92f389a2a30aa846ffb1a7911))
- enable expression evaluation on all string and integer property panel fields ([b84946f](https://github.com/ptarmiganlabs/onboard.qs/commit/b84946ff07d6e08e71336ea5b1222fe595b3853a))
- enhance button sizing with width, height, and fill options ([b0637cc](https://github.com/ptarmiganlabs/onboard.qs/commit/b0637cc5db010fa6cf970854852091963bb7ae65))

### Bug Fixes

- address code review - fix label typo and update JSDoc ([3d5e7b8](https://github.com/ptarmiganlabs/onboard.qs/commit/3d5e7b80e18d82188a44d7c9db05785e620828d1))
- show only step details when a step is selected in tour editor ([0fbdf01](https://github.com/ptarmiganlabs/onboard.qs/commit/0fbdf017b38f2281195c2e8117239d163a7c93a5)), closes [#72](https://github.com/ptarmiganlabs/onboard.qs/issues/72)

### Refactoring

- simplify theme label strings to avoid wrapping in the property panel ([1301ebe](https://github.com/ptarmiganlabs/onboard.qs/commit/1301ebef4bfbad37493f94352be1e6976ec8f4b1))
- split ext.js into modular files under src/ext/ ([f20eff3](https://github.com/ptarmiganlabs/onboard.qs/commit/f20eff37a8a30fe2d2167678c0379176782a7277))

## [Unreleased]

### Features

- add build date/time to property panel About section and About dialog
- restructure theme and styling sections into subsections in property panel

## [1.6.0](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.5.0...onboard-qs-v1.6.0) (2026-03-14)

### Features

- add extension properties for hiding hover menu and context menu ([ea80a2c](https://github.com/ptarmiganlabs/onboard.qs/commit/ea80a2c905145566c0e535d6c5411de9c786a771))
- Add properties for showing/hiding context and hover menus ([a30702d](https://github.com/ptarmiganlabs/onboard.qs/commit/a30702d703777181e3082155acc8a69e0c008826)), closes [#74](https://github.com/ptarmiganlabs/onboard.qs/issues/74)
- Include a default onboarding tour when extension added to app sheet ([5e902af](https://github.com/ptarmiganlabs/onboard.qs/commit/5e902aff21012cca483f6be7152c936c042b7279))

### Bug Fixes

- add try-catch isolation in shared observer and improve JSDoc types ([d5c93d4](https://github.com/ptarmiganlabs/onboard.qs/commit/d5c93d413ce181c1c3a93c51cd994fe2c0622de2))
- address code review feedback - clean up redundant CSS and add JSDoc ([1bca13a](https://github.com/ptarmiganlabs/onboard.qs/commit/1bca13a3b3e724686a2df604fcf56b9124c8dc65))
- address review feedback for context menu and hover menu logic ([3763ddc](https://github.com/ptarmiganlabs/onboard.qs/commit/3763ddc205b6f232052f1e7128bef3ac7e0a8a9f))
- **client-managed:** Get rid of `product-info` warning in browser console ([5d0c160](https://github.com/ptarmiganlabs/onboard.qs/commit/5d0c160a5e918df3e251d94222eb23c92f6922e3))
- improve error handling in post-build script ([f42177a](https://github.com/ptarmiganlabs/onboard.qs/commit/f42177a9c43a36f27ca0898a77d71a6cce396cfd))
- Move extension into the ".qs Library" bundle in the Sense editor ([9b50a49](https://github.com/ptarmiganlabs/onboard.qs/commit/9b50a4964010e157e92a5fae76201d55d1403e42))
- prepend virtual proxy prefix to product-info.js fetch URL ([e53940e](https://github.com/ptarmiganlabs/onboard.qs/commit/e53940ea5be8513522a94da89792099e8714b5c4))

### Miscellaneous

- **deps:** bump actions/github-script from 7.0.1 to 8.0.0 ([957914e](https://github.com/ptarmiganlabs/onboard.qs/commit/957914e11b2586157c1cf6ab708581bc9bb922b6))
- **deps:** bump actions/setup-node from 6.2.0 to 6.3.0 ([28e8d0f](https://github.com/ptarmiganlabs/onboard.qs/commit/28e8d0f85b4e20af63edd3e7fdd1b7d6f421569c))
- **deps:** bump actions/setup-node from 6.2.0 to 6.3.0 ([5567a69](https://github.com/ptarmiganlabs/onboard.qs/commit/5567a69cdb08e13a889d7d7b1f8fbadd0249e1a0))
- **deps:** bump crazy-max/ghaction-virustotal from 4.2.0 to 5.0.0 ([0994466](https://github.com/ptarmiganlabs/onboard.qs/commit/09944668f4dea724f6367eebec17e7ebf8468346))
- **deps:** bump crazy-max/ghaction-virustotal from 4.2.0 to 5.0.0 ([b8e24d2](https://github.com/ptarmiganlabs/onboard.qs/commit/b8e24d2a402ab0d8e8c7cd650161bb7f96735cae))
- **deps:** bump github/codeql-action from 4.32.4 to 4.32.5 ([ac0c0a9](https://github.com/ptarmiganlabs/onboard.qs/commit/ac0c0a92c42bdd340e1e7fc749dfc4e0007f816c))
- **deps:** bump github/codeql-action from 4.32.5 to 4.32.6 ([325623a](https://github.com/ptarmiganlabs/onboard.qs/commit/325623a8638aef1a58d9fe6c18630053ae21253d))
- **deps:** bump github/codeql-action from 4.32.5 to 4.32.6 ([0f19faf](https://github.com/ptarmiganlabs/onboard.qs/commit/0f19faf6af6808336176a4510e45ad7e4f416024))
- **deps:** bump github/gh-aw from 0.51.2 to 0.52.0 ([2f4f448](https://github.com/ptarmiganlabs/onboard.qs/commit/2f4f44891dcfdc28f774b60b247d4e88b50934e1))
- **deps:** bump github/gh-aw from 0.52.0 to 0.57.0 ([7e55d9d](https://github.com/ptarmiganlabs/onboard.qs/commit/7e55d9db5cb9e231c6a24354a94744f217f3e149))
- **deps:** bump github/gh-aw from 0.52.0 to 0.57.0 ([744958b](https://github.com/ptarmiganlabs/onboard.qs/commit/744958b2cdb78d5f8933abcfa04ccc05af7e3c7a))
- update nebula.js and other dependencies to latest versions ([9ff76c8](https://github.com/ptarmiganlabs/onboard.qs/commit/9ff76c89673070c24f4b371aec9a29db84d7404b))

### Refactoring

- scope rightClickTimer cleanup inside contextMenuHandler guard ([2422c06](https://github.com/ptarmiganlabs/onboard.qs/commit/2422c06d51bad329ce79debb81e090fe6f93ee03))
- share a single MutationObserver across all extension instances ([4dcb116](https://github.com/ptarmiganlabs/onboard.qs/commit/4dcb11659cae176f88cae1e1062b04ac65c060c8))

## [1.5.0](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.4.0...onboard-qs-v1.5.0) (2026-03-04)

### Features

- add ARIA dialog semantics and focus management to import/export dialogs ([450f1e8](https://github.com/ptarmiganlabs/onboard.qs/commit/450f1e888eccb86474e9482f3bdee27b1e566f79))
- add selective tour export dialog with per-tour checkboxes ([97eb4a4](https://github.com/ptarmiganlabs/onboard.qs/commit/97eb4a45ccf96621e42c507f4d0a34cc3c365a55))

### Bug Fixes

- default includeTheme to false when theme toggle is not rendered ([d928a55](https://github.com/ptarmiganlabs/onboard.qs/commit/d928a55c63cfbdd4e775ab4a1bfba58f4e90b288))
- update file type restrictions for duplicate code detection workflow ([bb92265](https://github.com/ptarmiganlabs/onboard.qs/commit/bb92265ca1a68c329f5f1d075039342036481987))
- update gh-aw-metadata in workflow files ([17ca054](https://github.com/ptarmiganlabs/onboard.qs/commit/17ca054ba94983ae4a81ad68e563401575cd4087))

### Miscellaneous

- update dependencies ([e4a75fd](https://github.com/ptarmiganlabs/onboard.qs/commit/e4a75fd2488aa41d903fc4621d3da42477e81d6f))

### Refactoring

- consolidate shared import/export dialog CSS via grouped selectors ([76860e5](https://github.com/ptarmiganlabs/onboard.qs/commit/76860e5b6c64b8fdfa8b1df8dcc3358b6e67b50b))

## [1.4.0](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.3.1...onboard-qs-v1.4.0) (2026-03-01)

### Features

- Include child objects in layout containers ([8085240](https://github.com/ptarmiganlabs/onboard.qs/commit/8085240841d905bcb33def3780a1ff457c38eccb)), closes [#56](https://github.com/ptarmiganlabs/onboard.qs/issues/56)

### Bug Fixes

- Add extension preview image ([99c5f37](https://github.com/ptarmiganlabs/onboard.qs/commit/99c5f37611f889584b1953cfc854646eb7727271))
- use distinct icons for export (📤) and import (📂) buttons in tour editor ([ec3c5ef](https://github.com/ptarmiganlabs/onboard.qs/commit/ec3c5ef051c18c55e759210ca10a4f966e47bc40))
- use distinct, semantically correct icons for Export and Import buttons in tour editor ([f366c1b](https://github.com/ptarmiganlabs/onboard.qs/commit/f366c1b2e556f6fff938c3082d213f778067aa08))

### Miscellaneous

- add husky, lint-staged, and gitleaks to pre-commit ([3c025d3](https://github.com/ptarmiganlabs/onboard.qs/commit/3c025d3707ec69497e2d222afc7a4193c893be46))
- Add repo status workflow for generating weekly reports ([056d691](https://github.com/ptarmiganlabs/onboard.qs/commit/056d6918c34fc9f8571c6edfe529b742040cd651))
- Add workflow to scan for malicious code ([60f4b0d](https://github.com/ptarmiganlabs/onboard.qs/commit/60f4b0d41b94d294c1a8dbf70d3dac301e4823cb))
- Add workflow to scan for secrets ([8dfa854](https://github.com/ptarmiganlabs/onboard.qs/commit/8dfa85456067beb72f4a6ad505de85287be24f10))
- **deps:** update globals package to version 17.4.0 ([02714dc](https://github.com/ptarmiganlabs/onboard.qs/commit/02714dc3f3166b0d33f92755498cebca8e4ff43f))
- Update daily-file-diet workflow to support JavaScript files ([75d1acb](https://github.com/ptarmiganlabs/onboard.qs/commit/75d1acb5659454af7a99d2da1fb95fd678b68857))
- Update duplicate code detector configuration to use JavaScript tool ([a1af28a](https://github.com/ptarmiganlabs/onboard.qs/commit/a1af28a59b483ecce837bfeaeb9d8aa096aa6a71))
- **workflows:** update code simplifier network permissions to include node and dart ([7216177](https://github.com/ptarmiganlabs/onboard.qs/commit/7216177795485fef33282238768e259bafa650d5))
- **workflows:** update code simplifier schedule and add agentic maintenance workflow ([1c50529](https://github.com/ptarmiganlabs/onboard.qs/commit/1c505293f83e84d07138405f1413028e135037c8))
- **workflows:** update daily repo status to weekly schedule and add actions lock ([48f9d06](https://github.com/ptarmiganlabs/onboard.qs/commit/48f9d0670db0a9bc38e501b0cbe29c438553e086))

### Documentation

- Add GitHub workflows documentation ([6b4cd9a](https://github.com/ptarmiganlabs/onboard.qs/commit/6b4cd9a4210e9971d194ef67d063cd3cc32fb188))

## [1.3.1](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.3.0...onboard-qs-v1.3.1) (2026-02-26)

### Bug Fixes

- Hide tour editor dialog during step preview ([32d03f6](https://github.com/ptarmiganlabs/onboard.qs/commit/32d03f625b287953a4061093437bd2a64dd382c8)), closes [#34](https://github.com/ptarmiganlabs/onboard.qs/issues/34)
- remove driver.js text-shadow causing fuzzy button text in step dialogs ([6c6e073](https://github.com/ptarmiganlabs/onboard.qs/commit/6c6e073b2d8441d5f8b769d558e00c7ac411b782))

### Miscellaneous

- **deps:** bump basic-ftp from 5.1.0 to 5.2.0 ([74a4d3c](https://github.com/ptarmiganlabs/onboard.qs/commit/74a4d3c8e17d4df7660b3c27355cd3ae83f3425a))

### Documentation

- add RTL language support investigation document ([eb83a5e](https://github.com/ptarmiganlabs/onboard.qs/commit/eb83a5e2408b5731e8f92e18b5cabee0c6321dcd))
- RTL language support investigation ([1c5a021](https://github.com/ptarmiganlabs/onboard.qs/commit/1c5a021c5fd9fc5415e699287c0d272f007ec73e))
- update README for clarity and add Development Guide ([c5570d8](https://github.com/ptarmiganlabs/onboard.qs/commit/c5570d8b954620b2716ee67b29a7db689002e89e))

## [1.3.0](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.2.2...onboard-qs-v1.3.0) (2026-02-26)

### Features

- add Description column to VirusTotal results table ([ff7e571](https://github.com/ptarmiganlabs/onboard.qs/commit/ff7e5713332fc2aa865a3fbfc0d5628315f8534d))
- scan inner onboard-qs.zip with VirusTotal and combine results ([50046bc](https://github.com/ptarmiganlabs/onboard.qs/commit/50046bcfcc44ef1d5380db6bf0ea7916d9fcbbdb))

### Bug Fixes

- use VirusTotal API directly for inner zip scan ([06222a3](https://github.com/ptarmiganlabs/onboard.qs/commit/06222a315ec6ce7387e91ef52975f940643a0d41))

### Documentation

- update VIRUS-SCAN.md to reflect direct API approach for inner zip ([7be2946](https://github.com/ptarmiganlabs/onboard.qs/commit/7be294626e5b9d832f0444cbd9725e648801ecaf))

## [1.2.2](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.2.1...onboard-qs-v1.2.2) (2026-02-25)

### Documentation

- add developer UX screenshot for onboarding ([4a767e0](https://github.com/ptarmiganlabs/onboard.qs/commit/4a767e0763c901e3557d5c7faf659683de4736c1))
- add documentation link for project release blog post and demo ([d3d4705](https://github.com/ptarmiganlabs/onboard.qs/commit/d3d47051ef8f5a0a5f53fe7d3de245e44cd04760))
- add screenshot of tour import dialog ([0769441](https://github.com/ptarmiganlabs/onboard.qs/commit/07694412348b75ba36ae4aa2c1ee2840447bf5c2))
- added screenshots and demo videos ([afacabf](https://github.com/ptarmiganlabs/onboard.qs/commit/afacabf3fdb9007a2c22f2eefa8baa0926dc0746))

## [1.2.1](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.2.0...onboard-qs-v1.2.1) (2026-02-24)

### Bug Fixes

- enhance about modal with keyboard close functionality ([d56f640](https://github.com/ptarmiganlabs/onboard.qs/commit/d56f640c6c110f8166da7b50787618dd7c66ade2))

## [1.2.0](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.1.1...onboard-qs-v1.2.0) (2026-02-24)

### Features

- add better customisation of tour dialogs visual appearance ([b69750b](https://github.com/ptarmiganlabs/onboard.qs/commit/b69750b0ccec0dc7cdea97e419a0adfcf288ab69))
- enhance widget functionality with responsive sizing and about modal ([f878025](https://github.com/ptarmiganlabs/onboard.qs/commit/f87802569608c6faef7219d92fed0c2f4bbab84b))
- update extension icon and add preview image in meta.json ([9a69d21](https://github.com/ptarmiganlabs/onboard.qs/commit/9a69d21f8ecfc86914693d4211dc069f07ca8895))

## [1.1.1](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.1.0...onboard-qs-v1.1.1) (2026-02-24)

### Bug Fixes

- use valid regex pattern in virus-scan workflow ([e5a5094](https://github.com/ptarmiganlabs/onboard.qs/commit/e5a5094a3722da8f6d3482e757e4c86ccb8f1e05))
- use valid regex pattern in virus-scan workflow ([2c96373](https://github.com/ptarmiganlabs/onboard.qs/commit/2c9637323aaa1cc68ac7613fda37f0eca44b044f))

### Miscellaneous

- **deps-dev:** bump eslint from 10.0.1 to 10.0.2 ([8b41945](https://github.com/ptarmiganlabs/onboard.qs/commit/8b41945d4e3405d72363e584479574ee55edb2c0))
- **deps-dev:** bump eslint from 10.0.1 to 10.0.2 ([2e8a419](https://github.com/ptarmiganlabs/onboard.qs/commit/2e8a419ca2385b6b7301e7075817ce7fa8ffd518))
- **deps-dev:** bump eslint-plugin-jsdoc from 62.7.0 to 62.7.1 ([224fcb7](https://github.com/ptarmiganlabs/onboard.qs/commit/224fcb7324ca051df6c5b7501d363e63144e75a1))

### Documentation

- Update security response timeline and credit policy ([b9db1ee](https://github.com/ptarmiganlabs/onboard.qs/commit/b9db1eefb30596be5b653c95666153173a14485f))
- Update security response timeline and credit policy ([dfd16eb](https://github.com/ptarmiganlabs/onboard.qs/commit/dfd16eb0e38d434c5d62a4fb80519766e3b99d0d))

## [1.1.0](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.0.0...onboard-qs-v1.1.0) (2026-02-23)

### Features

- Add support for Qlik Sense Cloud ([0ff4f9a](https://github.com/ptarmiganlabs/onboard.qs/commit/0ff4f9adfd087389e1ea673dbd6f3fcdc4fa229e))
- Enhance dialog customization options in tour editor and runner ([b808c09](https://github.com/ptarmiganlabs/onboard.qs/commit/b808c096296440519c2d3257cb1bd76ce1ab6960))
- Update version to 1.0.0, enhance CI workflows, and add security policy ([ebb03a9](https://github.com/ptarmiganlabs/onboard.qs/commit/ebb03a938cd8ae9b79b8ff70151f222e7a5da013))
- Update version to 1.0.0, enhance CI workflows, and add security… ([2223107](https://github.com/ptarmiganlabs/onboard.qs/commit/2223107ff1db9aa566e3cca4098df09262359adc))

### Miscellaneous

- Remove CodeQL analysis workflow configuration ([1a3bfcb](https://github.com/ptarmiganlabs/onboard.qs/commit/1a3bfcb82ec171d3b10a445d5646312cd315659c))
