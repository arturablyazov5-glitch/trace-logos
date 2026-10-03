#!/usr/bin/env node
// Modular vanilla JS → Figma's single main script, using the existing project esbuild.
const fs=require('fs');
const path=require('path');
const esbuild=require('esbuild');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'tools/figma-plugins/plates-to-component');
const result=esbuild.buildSync({entryPoints:[path.join(dir,'src/main.js')],bundle:true,write:false,format:'iife',target:'es2018',platform:'neutral',banner:{js:'// GENERATED from plates-to-component/src/*.js by npm run build. Do not edit.'},logLevel:'warning'});
const content=result.outputFiles[0].text;
new (require('vm').Script)(content);
if(process.argv.includes('--dry-run'))console.log('Плашки в компонент: bundle checked, dry run');
else {const file=path.join(dir,'code.js');if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==content)fs.writeFileSync(file,content);console.log('Плашки в компонент: code.js собран');}
