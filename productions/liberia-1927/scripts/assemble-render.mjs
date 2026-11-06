import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=path.resolve(process.argv[2]??'work/render/chunks'),out=path.resolve(process.argv[3]??'output/liberia-1927');
fs.mkdirSync(out,{recursive:true});
const expected=1392,fps=30,count=12;
const manifests=fs.readdirSync(root).filter(n=>/^chunk-\d{3}\.json$/.test(n)).map(n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'))).sort((a,b)=>a.index-b.index);
if(manifests.length!==count)throw new Error(`Expected ${count} chunks, found ${manifests.length}`);
const probe=p=>JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',p],{encoding:'utf8'}));
let cursor=0;const checks=[];
for(const [i,m] of manifests.entries()){
 if(m.index!==i||m.count!==count||m.start!==cursor||m.end!==Math.floor((i+1)*expected/count)-1||m.frames!==m.end-m.start+1)throw new Error(`Noncontiguous/incorrect manifest ${i}`);
 if(!m.nativeBuffer||m.nativeBuffer.width<1440||m.nativeBuffer.height<2560||m.nativeBuffer.preview)throw new Error(`Missing native Three.js drawing buffer proof in chunk ${i}`);
 const file=path.join(root,m.file),digest=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(digest!==m.sha256)throw new Error(`Checksum mismatch: ${file}`);
 const p=probe(file),v=p.streams.find(s=>s.codec_type==='video');
 if(!v||v.width!==1440||v.height!==2560||v.codec_name!=='h264'||v.pix_fmt!=='yuv420p'||v.r_frame_rate!=='30/1'||Number(v.nb_read_frames)!==m.frames)throw new Error(`Invalid chunk stream ${i}: ${JSON.stringify(v)}`);
 if(p.streams.some(s=>s.codec_type==='audio'))throw new Error(`Unexpected audio in visual chunk ${i}`);
 checks.push({index:i,start:m.start,end:m.end,frames:Number(v.nb_read_frames),nativeBuffer:m.nativeBuffer,sha256:digest});cursor=m.end+1;
}
if(cursor!==expected)throw new Error(`Incomplete range: ends at ${cursor}`);
const sources=new Set(manifests.map(m=>m.sourceCommit));if(sources.size!==1)throw new Error('Chunks came from different source commits');
const list=path.join(out,'concat.txt');fs.writeFileSync(list,manifests.map(m=>`file '${path.join(root,m.file).replaceAll("'","'\\''")}'`).join('\n')+'\n');
const picture=path.join(out,'picture.mp4'),final=path.join(out,'liberia-1927-final.mp4');
execFileSync('ffmpeg',['-hide_banner','-y','-f','concat','-safe','0','-i',list,'-map','0:v:0','-c:v','copy','-an','-movflags','+faststart',picture],{stdio:'inherit'});
const mix=path.resolve('public/audio/liberia-1927-mix.wav');if(!fs.existsSync(mix))throw new Error('Missing public/audio/liberia-1927-mix.wav');
const audioProbe=probe(mix),audio=audioProbe.streams.find(s=>s.codec_type==='audio');
if(!audio||Number(audio.sample_rate)!==48000||audio.channels!==2)throw new Error('Master mix must be 48 kHz stereo');
const duration=expected/fps;
execFileSync('ffmpeg',['-hide_banner','-y','-i',picture,'-i',mix,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-af','apad','-t',String(duration),'-movflags','+faststart','-metadata','title=Liberia 1927: The Impossible Election',final],{stdio:'inherit'});
const finalProbe=probe(final);fs.writeFileSync(path.join(out,'ffprobe.json'),JSON.stringify(finalProbe,null,2));
fs.writeFileSync(path.join(out,'assembly.json'),JSON.stringify({compositionId:'Liberia1927',sourceCommit:manifests[0].sourceCommit,frames:expected,fps,duration,width:1440,height:2560,chunks:checks,finalFile:path.basename(final),bytes:fs.statSync(final).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(final)).digest('hex'),mux:'ffmpeg -i picture.mp4 -i public/audio/liberia-1927-mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -af apad -t 46.4 -movflags +faststart liberia-1927-final.mp4'},null,2));
execFileSync('python3',['scripts/qa-final.py',final,out],{stdio:'inherit'});
console.log('Final output:',final);
