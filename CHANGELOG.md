# Changelog

## 1.0.0

- Fork Yarn Classic 1.22.22 with upstream Git history, BSD license and notices.
- Require Node >=20.19 and rebuild project code with Webpack 5/Babel 7. Declare
  all third-party runtime dependencies externally; reject hidden bundled dependencies.
- Replace request with its compatible maintained @cypress/request implementation;
  update tar-fs, ssri, micromatch, normalize-url, uuid and inquirer.
- Preserve Classic nohoist trailing-glob behavior with strictSlashes, CLI pattern
  alternation with an explicit group, and invalid-integrity repair under ssri 12.
- Preserve local archive file paths in Node 24 extraction diagnostics.
- Modernize Jest APIs, isolate operator npm configuration, run concurrent legacy
  cases serially, renew expired test TLS certificates and exercise real HTTP retry/TLS.
- Test the CLI with actual HTTP installation, integrity, offline frozen-lockfile
  reinstallation, paths/arguments containing spaces, and malicious archive rejection.
- Publish only the reviewed CI archive after CI, full audit and CodeQL checks;
  verify direct/aliased installations, signatures, provenance and immutable assets.
