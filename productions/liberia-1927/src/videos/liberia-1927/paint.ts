import * as THREE from 'three';
const cache=new Map<string,THREE.CanvasTexture>();
export type PaintKind='wood'|'plaster'|'paper'|'floor'|'book'|'ballot'|'ballot-faulkner'|'record';
export function paint(kind:PaintKind,base:string){
 const key=kind+base;if(cache.has(key))return cache.get(key)!;
 const cv=document.createElement('canvas');cv.width=cv.height=1024;const g=cv.getContext('2d')!;
 g.fillStyle=base;g.fillRect(0,0,1024,1024);
 if(kind==='wood'||kind==='floor'){
  const boards=kind==='wood'?7:11;
  for(let n=0;n<boards;n++){
   const y=n*1024/boards;
   g.fillStyle=n%3===0?'rgba(255,231,184,.06)':'rgba(82,41,31,.035)';g.fillRect(0,y,1024,1024/boards);
   g.strokeStyle='rgba(76,43,33,.38)';g.lineWidth=kind==='wood'?3:2.2;g.beginPath();g.moveTo(0,y+1);g.lineTo(1024,y+1);g.stroke();
   g.strokeStyle='rgba(255,231,181,.17)';g.lineWidth=2;g.beginPath();g.moveTo(0,y+4);g.lineTo(1024,y+4);g.stroke();
   for(let j=0;j<3;j++){const x=(n*131+j*317)%1024;g.strokeStyle='rgba(74,40,26,.10)';g.lineWidth=1.8;g.beginPath();g.moveTo(x,y+17+j*25);g.bezierCurveTo(x+30,y+12+j*25,x+95,y+26+j*25,x+170,y+18+j*25);g.stroke();}
   const x=(n*283)%1024;g.fillStyle='rgba(55,34,24,.38)';g.beginPath();g.arc(x+8,y+9,2.2,0,Math.PI*2);g.fill();
  }
 }else if(kind==='paper'){
  for(let y=9;y<1024;y+=13){g.strokeStyle=y%3?'rgba(107,94,71,.28)':'rgba(107,94,71,.4)';g.lineWidth=1.1;g.beginPath();g.moveTo(0,y);g.lineTo(1024,y+Math.sin(y)*1.5);g.stroke();}
  const edge=g.createLinearGradient(0,0,1024,0);edge.addColorStop(0,'rgba(141,109,62,.09)');edge.addColorStop(.15,'rgba(141,109,62,0)');edge.addColorStop(.85,'rgba(141,109,62,0)');edge.addColorStop(1,'rgba(141,109,62,.08)');g.fillStyle=edge;g.fillRect(0,0,1024,1024);
 }else if(kind==='ballot'||kind==='ballot-faulkner'||kind==='record'){
  const wash=g.createLinearGradient(0,0,1024,1024);wash.addColorStop(0,'rgba(251,242,218,.28)');wash.addColorStop(.5,'rgba(201,175,119,.035)');wash.addColorStop(1,'rgba(158,123,67,.13)');g.fillStyle=wash;g.fillRect(0,0,1024,1024);
  // Fixed, fine paper fibres and an old fold: no animated noise or line boil.
  for(let i=0;i<580;i++){const x=(i*433.13)%1024,y=(i*271.73)%1024;g.strokeStyle=i%2?'rgba(134,108,74,.055)':'rgba(255,249,230,.17)';g.lineWidth=.8;g.beginPath();g.moveTo(x,y);g.lineTo(x+2+i%7,y+1.4);g.stroke();}
  g.strokeStyle='rgba(127,103,70,.12)';g.lineWidth=2;g.beginPath();g.moveTo(511,0);g.lineTo(514,1024);g.stroke();g.strokeStyle='rgba(255,249,226,.4)';g.beginPath();g.moveTo(516,0);g.lineTo(519,1024);g.stroke();
  g.fillStyle='#5d5c4c';g.textAlign='center';g.font='bold 56px Georgia,serif';g.fillText(kind==='record'?'ELECTION RECORD':'PRESIDENTIAL BALLOT',512,145);
  g.font='31px Georgia,serif';g.fillText('LIBERIA  /  1927',512,202);
  g.strokeStyle='rgba(78,81,65,.48)';g.lineWidth=2;g.beginPath();g.moveTo(135,242);g.lineTo(889,242);g.stroke();
  if(kind!=='record'){
   g.textAlign='left';g.font='36px Georgia,serif';g.lineWidth=4;
   for(const [y,name] of [[385,'CHARLES D. B. KING'],[590,'THOMAS J. FAULKNER']] as const){g.strokeStyle='#777460';g.strokeRect(145,y-42,70,70);g.fillStyle='#66624e';g.fillText(name,260,y+5);g.fillStyle='rgba(102,98,78,.22)';g.fillRect(260,y+35,490,3);g.fillRect(260,y+52,365,2);}
   const tickOffset=kind==='ballot-faulkner'?205:0;g.strokeStyle='#4e5f54';g.lineWidth=12;g.lineCap='round';g.beginPath();g.moveTo(157,379+tickOffset);g.lineTo(177,400+tickOffset);g.lineTo(214,348+tickOffset);g.stroke();
   g.strokeStyle='rgba(130,67,57,.5)';g.lineWidth=4;g.beginPath();g.arc(773,814,77,0,Math.PI*2);g.stroke();g.beginPath();g.arc(773,814,65,0,Math.PI*2);g.stroke();
  }else{
   g.textAlign='left';g.font='31px Georgia,serif';
   for(const [i,row] of ['Registered voters','King — recorded votes','Faulkner — recorded votes','Presidential election'].entries()){
    const y=350+i*125;g.fillStyle='#66634e';g.fillText(row,125,y);g.textAlign='right';g.fillText(['15,000','243,000','9,000','1927'][i],900,y);g.textAlign='left';g.strokeStyle='rgba(102,98,78,.25)';g.beginPath();g.moveTo(125,y+30);g.lineTo(900,y+30);g.stroke();
   }
  }
  // Small irregular edge stains leave the printed surface readable.
  for(let i=0;i<11;i++){g.fillStyle='rgba(148,113,62,.03)';g.beginPath();g.ellipse((i*313)%1024,(i*191)%1024,15+i*2,5+i%4,.4,0,Math.PI*2);g.fill();}
 }else if(kind==='book'){
  g.strokeStyle='rgba(247,214,143,.6)';g.lineWidth=9;g.strokeRect(60,60,904,904);
  g.lineWidth=2;g.strokeRect(77,77,870,870);
  for(const y of [110,180,844,914]){g.fillStyle='rgba(229,190,104,.7)';g.fillRect(30,y,964,9);}
 }else{
  for(let i=0;i<40;i++){
   const x=(i*433)%1024,y=(i*271)%1024;
   g.fillStyle='rgba(255,247,217,.025)';g.fillRect(x,y,84+(i%4)*21,21);
  }
 }
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;cache.set(key,t);return t;
}
