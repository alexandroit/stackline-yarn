import assert from 'node:assert/strict';
import {mkdtemp,readFile,mkdir,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
const metadata=JSON.parse(await readFile('package.json','utf8'));
const root=await mkdtemp(path.join(os.tmpdir(),'stackline-pack-'));
try {
 const packedResult=JSON.parse(execFileSync('npm',['pack','--ignore-scripts','--json','--pack-destination',root],{encoding:'utf8'}));
 const packed=Array.isArray(packedResult)?packedResult[0]:Object.values(packedResult)[0];
 const archive=path.join(root,packed.filename);
 const manifest=JSON.parse(execFileSync('tar',['-xOf',archive,'package/package.json'],{encoding:'utf8'}));
 assert.deepEqual(manifest,metadata);
 for(const f of packed.files) assert(!/(^|\/)(?:node_modules|\.env|\.npmrc|\.git|test)(\/|$)/.test(f.path),f.path);
 const consumer=path.resolve('.package-consumer');await rm(consumer,{recursive:true,force:true});await mkdir(consumer);
 execFileSync('npm',['install','--prefix',consumer,'--ignore-scripts','--omit=dev','--no-audit','--no-fund',archive],{stdio:'inherit'});
 const target=path.join(consumer,'node_modules',metadata.name);
 execFileSync(process.execPath,['test/stackline.cjs'],{stdio:'inherit',env:{...process.env,STACKLINE_TEST_PACKAGE:target}});
 console.log('Packed archive manifest, contents, installation and real API tests passed.');
} finally {await rm(root,{recursive:true,force:true})}
