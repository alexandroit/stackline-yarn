# Upstream and security review

Base: [Yarn Classic 1.22.22 source](https://github.com/yarnpkg/yarn/commit/740c38c3a962c30ddb344a919bbfb7065620714b).
The native fork retains upstream history and BSD notices. This distribution is
rebuilt from source, not a claim that upstream's precompiled bundle was rebuilt
byte-for-byte. Node >=20.19 and external runtime dependencies are explicit
compatibility changes; CLI names, v1 lockfile and Classic protocols remain.

## Security scope

The original npm bundle contains tar-fs 1.16.3, confirmed by exact module-source
comparison after rewriting only webpack require references. An isolated
symlink/hardlink extraction fixture reproduced the directory escape documented
in [GHSA-pq67-2wwv-3xjx](https://github.com/advisories/GHSA-pq67-2wwv-3xjx) and
[GHSA-vj76-c3g6-qr5v](https://github.com/advisories/GHSA-vj76-c3g6-qr5v).
The rebuilt fork uses external tar-fs 1.16.6; that same fixture must reject the
archive and leave its outside sentinel unchanged. No upstream bundle is shipped.

The build inventory rejects node_modules content embedded in the new outputs.
Full and runtime npm audits therefore cover the actual third-party graph.
CodeQL analyzes source, bin and the rebuilt non-minified CLI/parser, with
minified-file extraction explicitly enabled as documented in
[CodeQL 2.24](https://codeql.github.com/docs/codeql-overview/codeql-changelog/codeql-cli-2.24.0/).

This request covers the original parent packages rather than recursively creating
forks for every dependency of this new tool. Inherited deprecated dependency
versions include glob@7.2.3, inflight@1.0.6, rimraf@2.7.1,
mkdirp-promise@5.0.1 and lodash.clone@4.5.0. Exact installed versions and
warnings are recorded by installation verification; this is not an unrestricted
Production Dependency Closure Policy pass. Vulnerabilities, invalid engines,
peers, integrity, lifecycle failures and deprecation of this maintained package
remain release blockers.

## Issues reviewed

- [#9210](https://github.com/yarnpkg/yarn/issues/9210): Classic still uses url.parse.
  Node 24's DEP0169 diagnostic remains visible; no general deprecation suppression
  is installed. It is a known compatibility qualification, not a solved claim.
- [#9198](https://github.com/yarnpkg/yarn/issues/9198): dependency engine selection
  is not redesigned. Existing package compatibility/resolver tests remain.
- [#9196](https://github.com/yarnpkg/yarn/issues/9196): CLI installs and script/bin
  arguments are exercised with spaces. This does not claim to fix every external
  native compiler's quoting behavior.
- [#9195](https://github.com/yarnpkg/yarn/issues/9195) and
  [#9183](https://github.com/yarnpkg/yarn/issues/9183): real HTTP timeout/retry,
  local registry and offline cache tests are retained. No claim is made about
  unprovided Windows/network reproductions.
- [#9192](https://github.com/yarnpkg/yarn/issues/9192): the requested v3/v4 monorepo
  protocol feature belongs to a different major line and is not added to Classic.

The sorting fixture now expects the redundant lockfile name to be omitted,
matching both unchanged source and the integrity-verified upstream 1.22.22
bundle used as an independent oracle.

No upstream maintainer was contacted. The original tests are retained while
obsolete Jest APIs, expired fixture certificates and snapshot rendering are
adapted to the modern toolchain. Publication requires their recorded CI result.

The original disabled info-command suite and three individually skipped upstream
cases remain disabled (15 cases total); they are not reported as passed. The
maintained CLI is additionally tested from its installed tarball.
