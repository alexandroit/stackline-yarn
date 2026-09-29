const webpack=require('webpack'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),metadata=require('../package.json');
const dependencies=Object.keys(metadata.dependencies);
const builtin=require('node:module').builtinModules;

webpack({mode:'none',target:'node20',context:root,entry:{cli:'./src/cli/index.js',lockfile:'./src/lockfile/index.js'},output:{path:path.join(root,'lib'),filename:'[name].js',library:{type:'commonjs2'}},node:{__dirname:false,__filename:false},optimization:{minimize:false},externals:[({request},callback)=>{if(dependencies.some(name=>request===name||request.startsWith(name+'/')))return callback(null,'commonjs '+request);if(!request.startsWith('.')&&!path.isAbsolute(request)&&!builtin.includes(request)&&!request.startsWith('node:'))return callback(new Error('Undeclared runtime import: '+request));callback();}],module:{rules:[{test:/\.js$/,exclude:/node_modules/,use:{loader:'babel-loader'}}]}},(error,stats)=>{
 if(error||stats.hasErrors()){console.error(error||stats.toString({all:false,errors:true}));process.exitCode=1;return;}
 const details=stats.toJson({all:false,modules:true,errors:true,warnings:true});
 if(details.warnings.length) throw new Error(JSON.stringify(details.warnings));
 if(details.modules.some(m=>(m.name||'').includes('node_modules/')))throw new Error('Third-party module unexpectedly embedded');
 const inventory={package:metadata.name,version:metadata.version,node:metadata.engines.node,runtimeDependencies:metadata.dependencies,modules:details.modules.map(m=>({name:m.name,size:m.size})),note:'Third-party runtime dependencies remain external and declared; npm audit covers the loaded dependency graph.'};
 fs.writeFileSync(path.join(root,'lib/build-inventory.json'),JSON.stringify(inventory,null,2)+'\n');console.log('Yarn CLI and lockfile parser rebuilt with declared external runtime dependencies.');
});
