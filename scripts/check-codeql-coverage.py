import json, os, pathlib, zipfile
root = pathlib.Path(os.environ['CODEQL_DATABASE'])
archives = list(root.rglob('src.zip'))
assert archives, 'CodeQL source archive is missing'
names = [name for archive in archives for name in zipfile.ZipFile(archive).namelist()]
required = ['lib/cli.js', 'lib/lockfile.js', 'bin/yarn.js', 'src/cli/index.js']
for suffix in required:
    assert any(name.endswith('/' + suffix) or name == suffix for name in names), 'Not extracted: ' + suffix
print(json.dumps({'extracted': required, 'status': 'PASS'}))
