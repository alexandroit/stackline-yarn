import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { retryAttestationAudit, retryRegistryInstall, validateProvenanceStatement } from './registry-requests.mjs'

const archive = path.resolve(process.argv[2])
const localBytes = await readFile(archive)
const metadata = JSON.parse(execFileSync('tar', ['-xOf', archive, 'package/package.json'], { encoding: 'utf8' }))
assert.equal(metadata.name, '@stackline/yarn')
assert.equal(metadata.repository.url, 'git+https://github.com/alexandroit/stackline-yarn.git')
const identity = `${metadata.name}@${metadata.version}`
const registry = 'https://registry.npmjs.org'
const integrity = `sha512-${createHash('sha512').update(localBytes).digest('base64')}`
const sha256 = createHash('sha256').update(localBytes).digest('hex')
const expectedSourceCommit = process.env.EXPECTED_SOURCE_COMMIT
const expectedPublicationRun = process.env.EXPECTED_PUBLICATION_RUN
assert.match(expectedSourceCommit || '', /^[0-9a-f]{40}$/, 'EXPECTED_SOURCE_COMMIT is required')
assert.match(expectedPublicationRun || '', /^https:\/\/github\.com\/alexandroit\/stackline-yarn\/actions\/runs\/[0-9]+\/attempts\/[0-9]+$/, 'EXPECTED_PUBLICATION_RUN is required')

async function get(url) {
  for (let attempt = 0; attempt < 120; attempt++) {
    const response = await globalThis.fetch(url, { signal: globalThis.AbortSignal.timeout(30_000) })
    if (response.ok) return response
    if (response.status !== 404 || attempt === 119) throw new Error(`HTTP ${response.status}: ${url}`)
    await delay(5_000)
  }
}

const official = await (await get(`${registry}/${encodeURIComponent(metadata.name)}/${metadata.version}`)).json()
assert.equal(official.name, metadata.name)
assert.equal(official.version, metadata.version)
assert(!official.deprecated, 'registry package is deprecated')
assert.equal(official.dist.integrity, integrity)
assert(official.dist.signatures?.length, 'registry signatures are required')
assert(official.dist.attestations?.url, 'registry provenance is required')
assert.equal(official.dist.attestations.provenance.predicateType, 'https://slsa.dev/provenance/v1')
const attestationUrl = new URL(official.dist.attestations.url)
assert.equal(attestationUrl.origin, registry)
const attestations = await (await get(attestationUrl)).json()
const provenanceEntries = attestations.attestations.filter((entry) => entry.predicateType === 'https://slsa.dev/provenance/v1')
assert.equal(provenanceEntries.length, 1, 'exactly one npm provenance attestation is required')
const provenance = provenanceEntries[0]
assert(provenance?.bundle?.dsseEnvelope, 'provenance envelope is required')
const statement = JSON.parse(Buffer.from(provenance.bundle.dsseEnvelope.payload, 'base64').toString('utf8'))
const { publicationRun, sourceCommit } = validateProvenanceStatement(statement, {
  identity,
  sha512: createHash('sha512').update(localBytes).digest('hex'),
  repository: 'alexandroit/stackline-yarn',
  workflowPath: '.github/workflows/publish.yml',
  expectedSourceCommit,
  expectedPublicationRun
})
const tarballUrl = new URL(official.dist.tarball)
assert.equal(tarballUrl.origin, registry)
const officialBytes = Buffer.from(await (await get(tarballUrl)).arrayBuffer())
assert(localBytes.equals(officialBytes), 'registry tarball differs from the reviewed CI artifact')

const workspace = await mkdtemp(path.join(os.tmpdir(), 'stackline-yarn-registry-'))
const consumers = []
function npm(args, cwd) {
  return execFileSync('npm', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}
try {
  for (const [kind, key, spec] of [
    ['direct', metadata.name, metadata.version],
    ['alias', 'upstream-package', `npm:${identity}`]
  ]) {
    const cwd = path.join(workspace, kind)
    await mkdir(cwd)
    await writeFile(path.join(cwd, 'package.json'), JSON.stringify({
      name: `stackline-registry-${kind}`,
      version: '1.0.0',
      private: true,
      dependencies: { [key]: spec }
    }))
    const installed = await retryRegistryInstall(
      () => spawnSync('npm', ['install', '--omit=dev', '--no-fund', '--registry', registry], {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      }),
      { packageName: metadata.name, version: metadata.version }
    )
    assert.equal(installed.status, 0, installed.stdout + installed.stderr)
    const installOutput = installed.stdout + installed.stderr
    const installWarnings = installOutput.split(/\r?\n/).filter(line => /^npm warn\b/i.test(line))
    // This parent-only migration does not recursively replace upstream transitive packages.
    // Keep deprecated transitive versions explicit; invalid peers/engines/integrity stay fatal.
    for (const warning of installWarnings) {
      assert.match(warning, /^npm warn deprecated /i, warning)
      assert(!warning.startsWith(`npm warn deprecated ${metadata.name}@`), 'The maintained package cannot be deprecated')
    }
    assert.doesNotMatch(installOutput, /EBADENGINE|ERESOLVE|EINTEGRITY|ELIFECYCLE|invalid:|extraneous:/i)
    const lock = JSON.parse(await readFile(path.join(cwd, 'package-lock.json'), 'utf8'))
    const locked = lock.packages[`node_modules/${key}`]
    assert.equal(locked.version, metadata.version)
    assert.equal(locked.integrity, integrity)
    assert.equal(locked.resolved, official.dist.tarball)
    const packed = JSON.parse(await readFile(path.join(cwd, 'node_modules', key, 'package.json'), 'utf8'))
    assert.equal(packed.name, metadata.name)
    assert.deepEqual(packed.dependencies || {}, metadata.dependencies || {})
    assert.equal(packed.license, metadata.license)
    assert.deepEqual(packed.engines, metadata.engines)
    const tree = JSON.parse(npm(['ls', '--all', '--omit=dev', '--json'], cwd))
    assert.deepEqual(tree.problems || [], [])
    const audit = JSON.parse(npm(['audit', '--omit=dev', '--audit-level=low', '--json', '--registry', registry], cwd))
    assert.equal(audit.metadata.vulnerabilities.total, 0)
    const signatures = await retryAttestationAudit(() => npm(['audit', 'signatures', '--registry', registry], cwd))
    const sbom = JSON.parse(npm(['sbom', '--omit=dev', '--sbom-format=cyclonedx'], cwd))
    assert(sbom.components.some(component => component.version === metadata.version))
    // Both package names must expose the real yarn/yarnpkg CLI and preserve installs/locks.
    execFileSync(process.execPath, ['test/stackline.cjs'], {
      stdio: 'pipe', env: {...process.env, STACKLINE_TEST_PACKAGE: path.join(cwd, 'node_modules', key)}
    })
    consumers.push({ kind, spec, locked, vulnerabilities: 0, installWarnings, dependencyClosureQualification: installWarnings.length ? 'Scoped parent-only migration: inherited transitive deprecations recorded; not an unrestricted Production Dependency Closure Policy pass' : null, signatures: signatures.trim(), sbom })
  }
} finally {
  await rm(workspace, { recursive: true, force: true })
}

const evidence = {
  schema: 'stackline-registry-verification-v1',
  observedAt: new Date().toISOString(),
  package: identity,
  sourceCommit,
  verificationCommit: process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  publicationRun,
  archive: path.basename(archive),
  bytes: localBytes.length,
  sha256,
  integrity,
  dist: official.dist,
  consumers,
  status: 'PASS'
}
await writeFile(path.join(path.dirname(archive), 'registry-verification.json'), `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify({ package: identity, sha256, integrity, consumers: consumers.length, status: 'PASS' }))
