const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'stackline-yarn-tests-'));
const env={...process.env};
for(const key of Object.keys(env))if(/^npm_config_/i.test(key))delete env[key];
const rc=path.join(temp,'empty.npmrc');fs.writeFileSync(rc,'');env.npm_config_userconfig=rc;
try { const result=spawnSync(process.execPath,[require.resolve('jest/bin/jest'),'--runInBand',...process.argv.slice(2)],{stdio:'inherit',env});process.exitCode=result.status??1; }
finally {fs.rmSync(temp,{recursive:true,force:true});}
