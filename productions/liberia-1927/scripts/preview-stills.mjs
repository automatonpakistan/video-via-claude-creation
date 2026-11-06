import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill,selectComposition,openBrowser} from '@remotion/renderer';
process.env.TMPDIR=path.resolve('work/remotion-tmp');process.env.TMP=process.env.TEMP=process.env.TMPDIR;
fs.mkdirSync(process.env.TMPDIR,{recursive:true});
const frames=(process.argv[2]??'95,225,380,575,750,900,1050,1200,1350').split(',').map(Number);
const native=process.argv.includes('--native');
const inputProps=native?{renderDpr:4/3,requireNative:true}:{previewDpr:.5};
const browserExecutable='/usr/bin/chromium',chromiumOptions={gl:'swangle'};
const serveUrl=await bundle({entryPoint:path.resolve('src/index.tsx'),publicDir:path.resolve('public'),onProgress:p=>{if(p===100)console.log('Bundle ready');}});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions,...(native?{forceDeviceScaleFactor:4/3}:{})});
try{
 const composition=await selectComposition({serveUrl,id:'Liberia1927',inputProps,puppeteerInstance:browser,browserExecutable,chromiumOptions,timeoutInMilliseconds:180000});
 for(const frame of frames){
  const start=Date.now();
  await renderStill({serveUrl,composition,frame,inputProps,output:path.resolve(`work/liberia-1927/stills/${native?'native-':''}frame-${String(frame).padStart(4,'0')}.png`),imageFormat:'png',scale:native?4/3:.5,puppeteerInstance:browser,browserExecutable,chromiumOptions,timeoutInMilliseconds:180000,onBrowserLog:l=>{if(l.type==='error'||l.text.includes('LIBERIA_NATIVE_BUFFER'))console.log('Browser:',l.text.slice(0,500));}});
  console.log(`Frame ${frame}: ${((Date.now()-start)/1000).toFixed(1)}s`);
 }
}finally{await browser.close({silent:true});}
