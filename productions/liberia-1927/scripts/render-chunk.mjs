import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia} from '@remotion/renderer';

const args=process.argv.slice(2),index=Number(args[0]??0),count=Number(args[1]??12);
const total=1392,fps=30,scale=4/3;
if(!Number.isInteger(index)||!Number.isInteger(count)||count<1||index<0||index>=count)throw new Error('Usage: node scripts/render-chunk.mjs INDEX COUNT [--plan]');
const start=Math.floor(index*total/count),end=Math.floor((index+1)*total/count)-1;
const id=String(index).padStart(3,'0'),outDir=path.resolve('work/render/chunks');
const plan={compositionId:'Liberia1927',index,count,start,end,frames:end-start+1,totalFrames:total,fps,scale,width:1440,height:2560,frameCoordinates:'global inclusive',previewDpr:'omitted'};
if(args.includes('--plan')){console.log(JSON.stringify(plan));process.exit(0);}
fs.mkdirSync(outDir,{recursive:true});
// Chromium's Unix socket path must remain below the platform length limit.
// GitHub's nested checkout path is too long for Chrome's SingletonSocket.
const tmp=process.env.RENDER_TMP??`/tmp/lbr-${process.env.GITHUB_RUN_ID??'local'}-${index}`;fs.mkdirSync(tmp,{recursive:true});
process.env.TMPDIR=tmp;process.env.TMP=tmp;process.env.TEMP=tmp;
const browserExecutable=process.env.RENDER_BROWSER??['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!browserExecutable)throw new Error('No installed Chrome/Chromium; set RENDER_BROWSER');
const chromiumOptions={gl:'swangle'},inputProps={renderDpr:scale,requireNative:true};
const outputLocation=path.join(outDir,`chunk-${id}.mp4`);
const started=new Date().toISOString();
console.log('Render plan:',JSON.stringify({...plan,browserExecutable}));
const serveUrl=await bundle({entryPoint:path.resolve('src/index.tsx'),publicDir:path.resolve('public')});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions,forceDeviceScaleFactor:scale});
let last=-1,nativeBuffer=null;
const onBrowserLog=l=>{
 if(l.type==='error'||l.text?.includes('LIBERIA_NATIVE_BUFFER'))console.log(`[browser ${l.type}] ${l.text}`);
 if(l.text?.includes('LIBERIA_NATIVE_BUFFER')){
  const first=l.text.indexOf('{'),end=l.text.lastIndexOf('}');
  if(first>=0&&end>first){try{nativeBuffer=JSON.parse(l.text.slice(first,end+1));}catch{}}
 }
};
try{
 const composition=await selectComposition({serveUrl,id:plan.compositionId,inputProps,puppeteerInstance:browser,browserExecutable,chromiumOptions,timeoutInMilliseconds:180000,onBrowserLog});
 if(composition.durationInFrames!==total||composition.fps!==fps||composition.width!==1080||composition.height!==1920)throw new Error(`Composition contract changed: ${JSON.stringify(composition)}`);
 await renderMedia({serveUrl,composition,outputLocation,codec:'h264',crf:16,pixelFormat:'yuv420p',imageFormat:'png',
  x264Preset:'fast',gopSize:60,colorSpace:'bt709',muted:true,enforceAudioTrack:false,
  frameRange:[start,end],scale,inputProps,puppeteerInstance:browser,browserExecutable,chromiumOptions,
  concurrency:Number(process.env.RENDER_CONCURRENCY??1),timeoutInMilliseconds:180000,
  onProgress:p=>{const percent=Math.floor(p.progress*20)*5;if(percent!==last){last=percent;console.log(`Chunk ${id}: ${percent}% (${p.renderedFrames}/${plan.frames} frames)`);}},
  onBrowserLog});
}finally{await browser.close({silent:true});}
if(!nativeBuffer||nativeBuffer.width<1440||nativeBuffer.height<2560||nativeBuffer.preview)throw new Error(`Missing or insufficient native drawing buffer telemetry: ${JSON.stringify(nativeBuffer)}`);
const manifest={...plan,started,completed:new Date().toISOString(),browserExecutable,gl:'swangle',codec:'h264',crf:16,pixelFormat:'yuv420p',
 concurrency:Number(process.env.RENDER_CONCURRENCY??1),nativeBuffer,sourceCommit:process.env.GITHUB_SHA??null,file:path.basename(outputLocation),bytes:fs.statSync(outputLocation).size,
 sha256:crypto.createHash('sha256').update(fs.readFileSync(outputLocation)).digest('hex')};
fs.writeFileSync(path.join(outDir,`chunk-${id}.json`),JSON.stringify(manifest,null,2));
console.log('Completed',JSON.stringify(manifest));
