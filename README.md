# @stackline/yarn

> Yarn Classic-compatible package management with maintained Node.js tooling and declared runtime dependencies.

[![npm version](https://img.shields.io/npm/v/@stackline/yarn.svg?style=flat-square)](https://www.npmjs.com/package/@stackline/yarn)
[![license](https://img.shields.io/npm/l/@stackline/yarn.svg?style=flat-square)](https://github.com/alexandroit/stackline-yarn)
[![GitHub repository](https://img.shields.io/badge/GitHub-alexandroit%2Fstackline-yarn-181717?style=flat-square&logo=github)](https://github.com/alexandroit/stackline-yarn)
[![Docs](https://img.shields.io/badge/docs-alexandro.net-0f766e?style=flat-square)](https://alexandro.net/docs/vanilla/yarn/)
[![Reddit community](https://img.shields.io/badge/community-r%2FStackline-ff4500?style=flat-square&logo=reddit&logoColor=white)](https://www.reddit.com/r/Stackline/)

**[Documentation](https://alexandro.net/docs/vanilla/yarn/)** | **[npm](https://www.npmjs.com/package/@stackline/yarn)** | **[Issues](https://github.com/alexandroit/stackline-yarn/issues)** | **[Repository](https://github.com/alexandroit/stackline-yarn)**

**Current package version:** `1.0.1`

---

## Why this package?

`@stackline/yarn` is the Stackline-maintained distribution of `yarn@1.22.22`. It is an independent continuation of [yarn](https://github.com/yarnpkg/yarn); original authors and licenses remain credited below.

## Compatibility

| Item | Value |
| :--- | :--- |
| Package | `@stackline/yarn@1.0.1` |
| API target | `yarn@1.22.22` |
| Supported Node.js | `>=20.19.0` |
| License | `BSD-2-Clause` |
| CLI | `yarn, yarnpkg` |
| Runtime dependencies | `@zkochan/cmd-shim, bytes, camelcase, chalk, cli-table3, commander, death, debug, deep-equal, detect-indent, dnscache, glob, gunzip-maybe, hash-for-dep, ini, inquirer, invariant, is-builtin-module, is-ci, is-webpack-bundle, js-yaml, leven, loud-rejection, micromatch, mkdirp, node-emoji, normalize-url, npm-logical-tree, object-path, proper-lockfile, puka, punycode, read, request, request-capture-har, rimraf, semver, ssri, strip-ansi, strip-bom, tar-fs, tar-stream, uuid, v8-compile-cache, validate-npm-package-license, yn, minimatch` |

## Installation

```bash
npm install @stackline/yarn
```

Preserve existing imports and plugin resolution with an npm alias:

```bash
npm install yarn@npm:@stackline/yarn
```

## Usage and API reference

A maintained fork of Yarn Classic 1.22.22, rebuilt from its source history.
Requires **Node.js >=20.19.0**. Published package version: **1.0.0**.

```sh
npm install --global @stackline/yarn@1.0.1
yarn --version
yarnpkg install --frozen-lockfile
```

For a project-local toolchain:

```sh
npm install --save-dev yarn@npm:@stackline/yarn@1.0.1
npx yarn install
```

The `yarn` and `yarnpkg` commands retain Classic's v1 lockfile, dependency
protocols, cache/offline behavior and script/bin invocation. Existing
[Classic documentation](https://classic.yarnpkg.com/lang/en/docs/) describes
those commands. This fork is independent of the Yarn project.

## Packaging and compatibility

This release raises the Node.js minimum from upstream's Node 4 baseline to
20.19. It rebuilds the CLI and lockfile parser with current tools and security
updates. Third-party runtime dependencies are **external and declared** in
`package.json`, so normal npm installation is required. `lib/cli.js` copied
alone is no longer a standalone distribution. OS installers and Corepack
integration are outside this release's packaging contract.

`lib/build-inventory.json` lists the bundled project modules and external
runtime dependency specifications. The build rejects undeclared imports and
embedded third-party modules. `package-lock.json` records the exact CI graph.
The published tarball is the tested CI artifact, with npm provenance and a
matching immutable GitHub release.

## Development

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run test:cli
npm run test:security
npm run test:package
npm audit --audit-level=low
```

See [UPSTREAM.md](UPSTREAM.md) for issue triage, compatibility decisions and
known qualifications, [CHANGELOG.md](CHANGELOG.md) for changes, and
[SECURITY.md](SECURITY.md) for private vulnerability reporting.


## Maintenance and compatibility notes

Node.js >=20.19.0 is required. Runtime dependencies are declared and installed normally; copying lib/cli.js alone does not create a standalone Yarn distribution. The original 15 skipped upstream tests and retained transitive deprecations are documented in UPSTREAM.md.

## Credits and original authors

- Original project: [yarn](https://github.com/yarnpkg/yarn).
- Copyright (c) 2016-present, Yarn Contributors. All rights reserved.
- Copyright (c) 2016-present, Yarn Contributors.
- Stackline maintenance: [Alexandro Paixao Marques](https://www.linkedin.com/in/aleinfo/) and [Stackline contributors](https://github.com/alexandroit).

Original copyright, license notices and contributor acknowledgements remain part of this distribution. Stackline maintenance does not replace authorship of the original work.

## License

`BSD-2-Clause`. See the license and notice files in the [repository](https://github.com/alexandroit/stackline-yarn).

## Community and Links

- [Stackline website](https://alexandro.net/)
- [GitHub projects](https://github.com/alexandroit)
- [npm packages](https://www.npmjs.com/~alex360qc)
- [Reddit community — r/Stackline](https://www.reddit.com/r/Stackline/)
- [Maintainer LinkedIn](https://www.linkedin.com/in/aleinfo/)

Use this repository's issue tracker for reproducible bugs and feature requests. Join r/Stackline for examples, usage questions and release discussions.
