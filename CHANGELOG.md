# Changelog

## [1.6.0](https://github.com/ptarmiganlabs/onboard.qs/compare/onboard-qs-v1.5.0...onboard-qs-v1.6.0) (2026-03-14)

### Features

- add extension properties for hiding hover menu and context menu ([ea80a2c](https://github.com/ptarmiganlabs/onboard.qs/commit/ea80a2c905145566c0e535d6c5411de9c786a771))
- Add properties for showing/hiding context and hover menus ([a30702d](https://github.com/ptarmiganlabs/onboard.qs/commit/a30702d703777181e3082155acc8a69e0c008826)), closes [#74](https://github.com/ptarmiganlabs/onboard.qs/issues/74)
- Include a default onboarding tour when extension added to app sheet ([5e902af](https://github.com/ptarmiganlabs/onboard.qs/commit/5e902aff21012cca483f6be7152c936c042b7279))
- restructure theme and styling sections into subsections in property panel ([469d467](https://github.com/ptarmiganlabs/onboard.qs/commit/469d4672681bc2f56fe23f53ad944cdef3c537d9))

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
