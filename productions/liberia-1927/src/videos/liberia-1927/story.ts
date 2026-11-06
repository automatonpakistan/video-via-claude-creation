// Preview shot design. Segment boundaries come from the generated draft measurement;
// word cues remain provisional until audio review and word alignment are approved.
export type V3 = [number,number,number];
export const FPS = 30;
export const TOTAL_FRAMES = 1392;
export const smooth = (x:number) => { const t=Math.max(0,Math.min(1,x));return t*t*t*(t*(t*6-15)+10); };
export const mix = (a:number,b:number,t:number)=>a+(b-a)*t;
export type Shot = {id:number; name:string; start:number; end:number; place:'office'|'street'|'hall'|'archive'; light:'day'|'golden'; pos:V3; look:V3; fov:number; coc:number; roll?:number; push?:number};
export const SHOTS:Shot[] = [
 {id:1,name:'The impossible pile',start:0,end:5.416,place:'office',light:'day',pos:[3.5,2.8,8.4],look:[0,1.45,-.35],fov:38,coc:10,roll:-.025,push:.0008},
 {id:2,name:'Coastal Liberia, 1927',start:5.416,end:9.789,place:'street',light:'day',pos:[8.5,5.4,17.8],look:[0,3.1,-3],fov:45,coc:0,push:.0011},
 {id:3,name:'The two candidates',start:9.789,end:15.694,place:'street',light:'day',pos:[.5,2.05,8.5],look:[0,1.35,.2],fov:38,coc:8,push:.0011},
 {id:4,name:'Sixteen times the voters',start:15.694,end:21.935,place:'hall',light:'day',pos:[6.6,4.4,11.2],look:[0,1.6,-1.8],fov:43,coc:0,roll:.03,push:.0009},
 {id:5,name:'Every voter is still short',start:21.935,end:28.374,place:'hall',light:'day',pos:[-2.8,2.7,6.8],look:[-1.15,1.55,-.1],fov:37,coc:11,push:.0008},
 {id:6,name:'Faulkner receives nine thousand',start:28.374,end:31.528,place:'hall',light:'day',pos:[3.2,2.35,5.3],look:[2.05,1.45,-.1],fov:36,coc:13,push:.0013},
 {id:7,name:'The tally expands',start:31.528,end:37.955,place:'hall',light:'day',pos:[5.6,5.3,12.1],look:[0,1.55,-1.3],fov:44,coc:0,roll:-.04,push:.0007},
 {id:8,name:'A place in the record books',start:37.955,end:43.048,place:'archive',light:'golden',pos:[3.2,3.9,6.7],look:[0,1.25,0],fov:37,coc:12,push:.0009},
 {id:9,name:'Another term, a world record',start:43.048,end:46.4,place:'office',light:'golden',pos:[2.8,2.45,7.5],look:[0,1.5,-.4],fov:36,coc:9,push:.0011},
];
export const shotAt = (frame:number) => SHOTS.find(s=>frame/FPS>=s.start && frame/FPS<s.end) ?? SHOTS[SHOTS.length-1];
export const camAt = (frame:number) => {
 const shot=shotAt(frame),local=Math.max(0,frame-shot.start*FPS),k=Math.pow(1-(shot.push??.001),local);
 const pos=shot.pos.map((v,i)=>shot.look[i]+(v-shot.look[i])*k) as V3;
 return {shot,pos,look:shot.look,fov:shot.fov,roll:(shot.roll??0)*smooth(local/24)};
};
