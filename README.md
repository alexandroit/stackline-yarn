# @stackline/yarn

A maintained fork of Yarn Classic 1.22.22, rebuilt from its source history.
Requires **Node.js >=20.19.0**. Published package version: **1.0.0**.

```sh
npm install --global @stackline/yarn@1.0.0
yarn --version
yarnpkg install --frozen-lockfile
```

For a project-local toolchain:

```sh
npm install --save-dev yarn@npm:@stackline/yarn@1.0.0
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
