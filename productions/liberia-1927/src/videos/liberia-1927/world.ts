import * as THREE from 'three';
import {Actor,KING,FAULKNER,CLERK,citizen} from './cast';
import {paint,PaintKind} from './paint';
import {twoTone,TONE,CHAR,untone} from './shade';
import {LIGHTS} from './lights';
import {NOINK} from './ink';
import {camAt,smooth,Shot} from './story';

const materials=new Map<string,THREE.MeshLambertMaterial>();
function mat(color:string,texture?:PaintKind){
 const key=color+(texture??'');if(materials.has(key))return materials.get(key)!;
 const m=twoTone(new THREE.MeshLambertMaterial({color:texture?'#ffffff':color,map:texture?paint(texture,color):null}));materials.set(key,m);return m;
}
const cube=new THREE.BoxGeometry(1,1,1);
function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,color:string,texture?:PaintKind){
 const mesh=new THREE.Mesh(cube,mat(color,texture));mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function cylinder(parent:THREE.Object3D,r1:number,r2:number,h:number,x:number,y:number,z:number,color:string,n=12){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,n),mat(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;
}
function sphere(parent:THREE.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string){
 const m=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;
}
function beam(parent:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,r:number,col:string){
 const dir=b.clone().sub(a),m=cylinder(parent,r,r,dir.length(),...(a.clone().add(b).multiplyScalar(.5).toArray() as [number,number,number]),col,8);
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return m;
}
function palm(parent:THREE.Object3D,x:number,z:number,s=1){
 const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);parent.add(g);
 for(let j=0;j<9;j++){const a=new THREE.Vector3(.07*j,j*.48,0),b=new THREE.Vector3(.07*(j+1),(j+1)*.48,0);beam(g,a,b,.13-j*.006,j%2?'#927356':'#aa8962');}
 for(let j=0;j<8;j++){
  const a=j*Math.PI/4,cx=.6,cy=4.3;
  const geo=new THREE.BufferGeometry(),verts:number[]=[],indices:number[]=[];
  for(let k=0;k<=8;k++){
   const u=k/8,r=2.55*u,y=cy+.7*Math.sin(u*Math.PI)-1.1*u*u,w=.34*Math.sin(u*Math.PI);
   const px=cx+Math.sin(a)*r,pz=Math.cos(a)*r;
   verts.push(px-Math.cos(a)*w,y,pz+Math.sin(a)*w,px+Math.cos(a)*w,y,pz-Math.sin(a)*w);
   if(k<8){const i=k*2;indices.push(i,i+1,i+2,i+1,i+3,i+2);}
  }
  geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
  const m=mat(j%2?'#4c8159':'#608f61').clone();m.side=THREE.DoubleSide;const leaf=new THREE.Mesh(geo,m);leaf.castShadow=true;g.add(leaf);
 }
}
function flag(parent:THREE.Object3D,x:number,z:number,scale=1){
 const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);
 cylinder(g,.027,.027,4,0,2,0,'#baa579');sphere(g,0,4.04,0,.065,.065,.065,'#d2aa54');
 for(let i=0;i<11;i++)box(g,1.338,.064,.016,.689,3.75-i*.064,0,i%2?'#eee8d9':'#ab4850');
 box(g,.32,.32,.024,.18,3.622,.004,'#354b79');
 const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.035:.08;const px=Math.cos(a)*r,py=Math.sin(a)*r;if(i===0)shape.moveTo(px,py);else shape.lineTo(px,py);}shape.closePath();
 const star=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat('#f6edd6'));star.position.set(.18,3.622,.02);g.add(star);
 return g;
}
function stack(parent:THREE.Object3D,x:number,y:number,z:number,h:number,rotation=0,w=.72,d=.52,choice:'king'|'faulkner'='king'){
 const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rotation;parent.add(g);
 const bundles=Math.max(2,Math.min(6,Math.ceil(h/.3))),piece=h/bundles;
 for(let k=0;k<bundles;k++){
  const layer=box(g,w,piece-.004,d,.016*Math.sin(k*2.7),piece*(k+.5),.013*Math.cos(k*1.3),k%2?'#e9e0c9':'#e7dfc5','paper');layer.rotation.y=.012*Math.sin(k*2.4);
 }
 const surface=choice==='faulkner'?'ballot-faulkner':'ballot';
 box(g,w+.015,.018,d+.013,0,h+.009,0,'#f4ecd3',surface);
 for(let k=0;k<2;k++){
  const sheet=box(g,w+.025,.009,d+.022,.015*Math.sin(k*3),h+.026+k*.012,.014*Math.cos(k),'#f3ead0',surface);sheet.rotation.y=(k-1)*.036;
 }
 return g;
}
function ballotBox(parent:THREE.Object3D,x:number,y:number,z:number,s=1){
 const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(s);parent.add(g);
 box(g,.93,.72,.73,0,.36,0,'#9d6d42','wood');box(g,1.01,.09,.8,0,.765,0,'#b17e49','wood');
 box(g,.39,.009,.065,0,.816,0,'#342d37');box(g,.1,.13,.035,0,.5,.388,'#c8a25d');
 cylinder(g,.05,.05,.018,0,.59,.407,'#9c4945',12).rotation.x=Math.PI/2;
 for(const xx of [-.36,.36])box(g,.07,.63,.025,xx,.37,.38,'#706351');return g;
}
function desk(parent:THREE.Object3D,x=0,z=0,w=3.1){
 const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
 box(g,w,.14,1.5,0,1.12,0,'#99704e','wood');box(g,w+.12,.07,1.58,0,1.22,0,'#be915f','wood');
 for(const xx of [-1,1]){
  box(g,.42,.89,1.15,xx*(w/2-.35),.56,-.05,'#98704f','wood');
  for(let j=0;j<3;j++){box(g,.39,.21,.025,xx*(w/2-.35),.84-j*.24,.54,'#a17b54','wood');cylinder(g,.025,.025,.042,xx*(w/2-.35),.84-j*.24,.58,'#cfb777').rotation.x=Math.PI/2;}
 }
 return g;
}
function windowFrame(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number){
 for(const xx of [-1,1])box(parent,.12,h+.18,.17,x+xx*w/2,y,z,'#d9c39a','wood');
 for(const yy of [-1,1])box(parent,w+.26,.11,.19,x,y+yy*h/2,z,'#ead8af','wood');
 box(parent,.065,h,.085,x,y,z,'#e2cea3');box(parent,w,.065,.08,x,y+.05,z,'#e2cea3');
 box(parent,w+.45,.13,.48,x,y-h/2-.05,z+.14,'#d5b98a','wood');
}
function room(parent:THREE.Group,archive=false){
 box(parent,13,.2,13,0,-.11,-1,'#b18a5e','floor');
 const wall=archive?'#b6bfbd':'#d6c5a1';
 box(parent,13,1.15,.25,0,.575,-5,wall,'plaster');box(parent,13,.75,.25,0,4.62,-5,wall,'plaster');
 box(parent,3.2,3.1,.25,0,2.7,-5,wall,'plaster');
 for(const x of [-5.45,5.45])box(parent,2.1,3.1,.25,x,2.7,-5,wall,'plaster');
 box(parent,.22,5,13,-6.5,2.5,-1,wall,'plaster');box(parent,.22,5,13,6.5,2.5,-1,wall,'plaster');
 box(parent,13,.15,13,0,5,-1,'#ddcba6','plaster').castShadow=false;
 for(const x of [-3,3]){
  windowFrame(parent,x,2.7,-4.82,2.8,2.95);
  for(const side of [-1,1]){
   const sh=box(parent,.52,2.8,.13,x+side*1.78,2.7,-4.6,'#57796e','wood');sh.rotation.y=side*.28;
   for(let i=0;i<8;i++)box(parent,.45,.045,.18,x+side*1.78,1.6+i*.31,-4.52,'#46695e');
  }
 }
 for(const x of [-6.25,6.25])box(parent,.13,.14,13,x,.16,-1,'#776348');
 box(parent,13,.18,.2,0,.16,-4.78,'#8c765a');box(parent,13,.2,.26,0,4.22,-4.79,'#ebd7ad');
 const sea=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshBasicMaterial({color:untone('#43aabd')}));sea.rotation.x=-Math.PI/2;sea.position.set(0,-.7,-40);sea.layers.set(NOINK);parent.add(sea);
 palm(parent,-5,-10,1.4);palm(parent,7,-13,1.7);
 for(const x of [-2.7,2.7]){
  box(parent,.38,.06,2.5,x,.018,2,'#c7b192');
 }
}
function house(parent:THREE.Object3D,x:number,z:number,w:number,h:number,d:number,col:string){
 const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
 box(g,w,h,d,0,h/2,0,col,'plaster');box(g,w+.3,.18,d+.3,0,.2,0,'#b39a79');
 const roof=new THREE.Mesh(new THREE.ConeGeometry(1,1,4),mat('#8d6859'));roof.scale.set(w*.78,1.1,d*.78);roof.rotation.y=Math.PI/4;roof.position.y=h+.5;roof.castShadow=true;g.add(roof);
 for(const xx of [-w*.26,w*.26]){
  box(g,.54,1.05,.07,xx,h*.63,d/2+.045,'#3f6270');
  for(const side of [-1,1])box(g,.16,1.09,.09,xx+side*.36,h*.63,d/2+.08,'#617f70','wood');
  box(g,.78,.08,.18,xx,h*.63-.56,d/2+.08,'#d8c39e');
 }
 box(g,.62,1.6,.1,0,.83,d/2+.06,'#65594b','wood');
}
function civic(parent:THREE.Object3D){
 const g=new THREE.Group();g.position.set(0,0,-5.8);parent.add(g);
 box(g,8.4,4.6,4.3,0,2.45,0,'#dfd0aa','plaster');box(g,8.8,.33,4.7,0,.25,0,'#b7a184');
 for(const y of [1.7,3.5])for(const x of [-2.9,-1.5,1.5,2.9]){
  box(g,.66,1,.09,x,y,2.21,'#395c6c');
  for(const s of [-1,1])box(g,.18,1.05,.12,x+s*.45,y,2.23,'#587f6d','wood');
  box(g,.95,.11,.2,x,y-.55,2.27,'#d1b887');
 }
 box(g,1.13,2.3,.14,0,1.4,2.23,'#5b4a40','wood');
 box(g,6.5,.22,2.2,0,3.1,3,'#c7b38e');
 for(const x of [-2.9,-1.8,1.8,2.9]){
  cylinder(g,.13,.16,2.65,x,1.68,3.72,'#e3d2aa');box(g,.42,.14,.42,x,.4,3.72,'#c8b590');box(g,.43,.16,.43,x,3,3.72,'#e4d1a5');
 }
 for(let i=0;i<3;i++)box(g,6.8+i*.35,.15,2.35+i*.2,0,.075+i*.15,3.18,'#c6b494');
 const shape=new THREE.Shape();shape.moveTo(-4.55,0);shape.lineTo(0,1.5);shape.lineTo(4.55,0);shape.closePath();
 const pediment=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:4.8,bevelEnabled:false}),mat('#c9b48f'));pediment.position.set(0,4.7,-2.45);pediment.castShadow=true;g.add(pediment);
 box(g,9.2,.13,4.95,0,4.65,0,'#e5d4ae');flag(g,0,-.5,.65).position.y=6.05;
}
function shelves(parent:THREE.Object3D,x:number,z:number){
 const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
 for(const xx of [-.72,.72])box(g,.13,3.6,.72,xx,1.8,0,'#79634d','wood');
 for(let j=0;j<5;j++){
  box(g,1.6,.09,.78,0,.2+j*.78,0,'#8c7354','wood');
  for(let i=0;i<7;i++){
   const h=.43+(i%3)*.075,b=box(g,.135,h,.48,-.56+i*.18,.24+j*.78+h/2,0,['#5c6b73','#94675e','#897748','#56766a'][i%4],'book');
   b.rotation.z=i%4===0?.05:0;
  }
 }
}

export class World{
 root=new THREE.Group();office=new THREE.Group();street=new THREE.Group();hall=new THREE.Group();archive=new THREE.Group();
 sun=new THREE.DirectionalLight('#fff3dc',3);fill=new THREE.HemisphereLight('#dcecff','#ad987b',.55);
 officeKing:Actor;streetKing:Actor;streetFaulkner:Actor;hallClerk:Actor;hallFaulkner:Actor;hallVoters:Actor[]=[];streetVoters:Actor[]=[];
 officePiles:THREE.Group[]=[];hallPiles:THREE.Group[]=[];flying:THREE.Mesh[]=[];outroBook:THREE.Group;bookPage:THREE.Group;faulknerPile:THREE.Group;extraBundle:THREE.Group;
 private sky:THREE.Mesh;private skyMat:THREE.ShaderMaterial;
 constructor(){
  for(const g of [this.office,this.street,this.hall,this.archive])this.root.add(g);
  this.root.add(this.sun,this.sun.target,this.fill);
  this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:.5,far:65});this.sun.shadow.bias=-.00025;this.sun.shadow.normalBias=.018;
  this.skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:untone('#3e7fd2')},horizon:{value:untone('#b8d0ec')}},vertexShader:'varying vec3 vDir; void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 vDir;uniform vec3 top;uniform vec3 horizon;void main(){float y=max(0.0,normalize(vDir).y);gl_FragColor=vec4(mix(horizon,top,smoothstep(0.0,.35,y)),1.0);}'});
  this.sky=new THREE.Mesh(new THREE.SphereGeometry(350,24,16),this.skyMat);this.sky.layers.set(NOINK);this.sky.renderOrder=-10;this.root.add(this.sky);
  // King's office: windows, painted joinery, a green carpet, heavy desk and period props.
  room(this.office);
  box(this.office,5,.026,4.5,0,.014,-.1,'#5f8178');
  for(const xx of [-2.3,2.3])box(this.office,.08,.028,4.25,xx,.03,-.1,'#c8b27a');
  for(const zz of [-2.12,1.92])box(this.office,4.68,.03,.08,0,.032,zz,'#c8b27a');
  desk(this.office);box(this.office,1.2,1.9,.16,0,1.15,-1.67,'#675047','wood');
  box(this.office,1.8,1.7,.13,0,3.08,-4.7,'#b49a61','wood');box(this.office,1.52,1.42,.07,0,3.08,-4.6,'#526b65');
  // Portrait is an original abstract silhouette, not a sourced historical likeness.
  sphere(this.office,0,3.27,-4.54,.27,.31,.025,'#a78158');box(this.office,.62,.54,.03,0,2.88,-4.51,'#384b59');
  flag(this.office,-2.25,-3.5,.77);
  this.officeKing=new Actor(this.office,KING,1);
  for(const [x,z,h] of [[-1.12,-.2,.72],[1.12,-.25,.9],[-2.05,.05,1.9],[2.15,.15,2.4],[-2.45,-1.3,1.3],[2.5,-1.25,1.7]] as number[][]){
   const base=Math.abs(x)<1.5?1.27:0;this.officePiles.push(stack(this.office,x,base,z,h,x*.07,Math.abs(x)<1.5?.65:.9,.65));
  }
  box(this.office,.85,.025,.57,0,1.28,.2,'#4d6f68','book');box(this.office,.68,.012,.49,-.1,1.301,.25,'#eee5cb','record');
  cylinder(this.office,.07,.08,.13,.72,1.35,.28,'#354a55');beam(this.office,new THREE.Vector3(.74,1.41,.28),new THREE.Vector3(.83,1.8,.2),.013,'#c9b88e');
  cylinder(this.office,.11,.13,.04,-.69,1.3,.3,'#bfa15e');cylinder(this.office,.035,.045,.22,-.69,1.42,.3,'#866346');
  for(let i=0;i<14;i++){
   const sheet=box(this.office,.34,.012,.26,0,0,0,'#f1e7ce','ballot');this.flying.push(sheet);
  }
  // Coastal polling station exterior: complete street, ocean, palms and civic architecture.
  box(this.street,100,.24,100,0,-.16,-15,'#bda06d','plaster');box(this.street,5,.03,40,0,.01,7,'#c7ab7e','plaster');
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(180,100),new THREE.MeshBasicMaterial({color:untone('#3ba7b7')}));sea.rotation.x=-Math.PI/2;sea.position.set(0,-.12,-56);sea.layers.set(NOINK);this.street.add(sea);
  civic(this.street);house(this.street,-8,-6,3.7,3.6,4.1,'#c2ac86');house(this.street,8,-8,3.9,4,4.3,'#bca48b');house(this.street,-11,-17,4.3,4.4,4.5,'#a8b3a4');house(this.street,11,-19,4.3,4.8,4.5,'#ceb998');
  for(const [x,z,s] of [[-5,2,1.4],[5.8,-2,1.5],[-6,-14,1.9],[7,-21,2.2],[-15,-27,2]] as number[][])palm(this.street,x,z,s);
  ballotBox(this.street,0,.82,1.05,.8);box(this.street,1.7,.1,1.15,0,.77,1.1,'#aa8153','wood');for(const xx of [-.65,.65])box(this.street,.1,.75,.95,xx,.37,1.1,'#86664a','wood');
  this.streetKing=new Actor(this.street,KING,2);this.streetFaulkner=new Actor(this.street,FAULKNER,3);
  for(let i=0;i<7;i++)this.streetVoters.push(new Actor(this.street,citizen(i),i+5));
  // Counting hall: high shuttered windows, counting tables and a field of paper columns.
  room(this.hall);box(this.hall,2.3,.018,8.3,0,.018,-.4,'#a65f52');
  for(const x of [-4.6,4.6]){
   cylinder(this.hall,.19,.23,4.3,x,2.15,-2.8,'#d5c6a3');box(this.hall,.56,.15,.56,x,.1,-2.8,'#b9a583');box(this.hall,.58,.16,.58,x,4.25,-2.8,'#e0d0ad');
  }
  desk(this.hall,-1.3,.3,2.2);desk(this.hall,2.05,.3,2.05);
  ballotBox(this.hall,-1.5,1.27,.3,.65);this.faulknerPile=stack(this.hall,1.95,1.27,.3,.22,0,.72,.54,'faulkner');
  for(let i=0;i<16;i++){
   const col=i%4,row=Math.floor(i/4),x=-3.15+col*1.75,z=-1.6-row*.85,h=1.5+((i*7)%5)*.25;
   this.hallPiles.push(stack(this.hall,x,0,z,h,(i%3-1)*.075,.9,.64));
  }
  this.extraBundle=stack(this.hall,2.1,2.1,-2.45,.16,.08,.85,.61);
  this.hallClerk=new Actor(this.hall,CLERK,12);this.hallFaulkner=new Actor(this.hall,FAULKNER,13);
  for(let i=0;i<5;i++)this.hallVoters.push(new Actor(this.hall,citizen(i+10),i+18));
  // Archive insert: an open original record book, warm window light and receding shelves.
  room(this.archive,true);desk(this.archive,0,.3,3.9);
  for(const x of [-4.7,-2.95,2.95,4.7])shelves(this.archive,x,-3.4);
  this.outroBook=new THREE.Group();this.outroBook.position.set(0,1.29,.4);this.archive.add(this.outroBook);
  box(this.outroBook,2.17,.1,1.35,0,0,0,'#526d76','book');box(this.outroBook,2.07,.16,1.25,0,.12,0,'#e7d9b9','paper');
  for(const s of [-1,1]){
   const page=box(this.outroBook,1.005,.025,1.2,s*.52,.221,0,'#f3e5c6','record');page.rotation.z=s*-.07;
  }
  this.bookPage=new THREE.Group();this.bookPage.position.y=.27;this.outroBook.add(this.bookPage);box(this.bookPage,1.02,.012,1.21,.51,0,0,'#efe1c2','record');
  stack(this.archive,-1.5,1.27,.1,.21,0,.48,.66);cylinder(this.archive,.11,.1,.19,1.42,1.38,.45,'#b19d6a');
 }
 update(frame:number,camera:THREE.PerspectiveCamera,scene:THREE.Scene){
  const time=frame/30,c=camAt(frame),s=c.shot;
  this.office.visible=s.place==='office';this.street.visible=s.place==='street';this.hall.visible=s.place==='hall';this.archive.visible=s.place==='archive';
  camera.position.set(...c.pos);camera.up.set(Math.sin(c.roll),Math.cos(c.roll),0);camera.lookAt(...c.look);camera.fov=c.fov;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  const L=LIGHTS[s.light],inside=s.place!=='street';
  TONE.uLitCol.value.set(...(inside&&s.light==='golden'?[1.45,1.14,.9]:L.lit) as [number,number,number]);TONE.uShadeCol.value.set(...(inside?(s.light==='day'?[.43,.4,.46]:[.4,.31,.48]) as [number,number,number]:L.shade));
  TONE.uShadeLift.value.set(...L.lift);TONE.uLambert.value=L.lambert;TONE.uSideK.value=L.sideK;TONE.uTerm.value=L.term;TONE.uSat.value=1.04;TONE.uBounce.value.set(...(s.light==='golden'?[.06,.025,.01]:[0,0,0]) as [number,number,number]);
  CHAR.uCharTint.value.set(...L.charTint);CHAR.uCharShade.value=.9;CHAR.uGrad.value=.055;CHAR.uBodyGrad.value=.16;CHAR.uSideTint.value.set(...L.sideTint);
  this.sun.color.set(L.sunCol);this.sun.intensity=L.sunI;
  this.sun.position.set(s.light==='golden'?-5:8,s.light==='golden'?7:14,s.light==='golden'?-9:7);this.sun.target.position.set(0,0,-1);
  this.skyMat.uniforms.top.value.copy(untone(L.top));this.skyMat.uniforms.horizon.value.copy(untone(L.hor));this.sky.position.copy(camera.position);
  if(!scene.fog)scene.fog=new THREE.Fog(L.fog,25,150);(scene.fog as THREE.Fog).color.copy(untone(L.fog));(scene.fog as THREE.Fog).near=inside?35:23;(scene.fog as THREE.Fog).far=inside?150:130;
  const local=time-s.start;
  if(this.office.visible){
   const wave=s.id===9?smooth(local/.55):undefined;
   this.officeKing.update(camera,time,[0,0,-1.28],s.id===9?'grin':'neutral',{wave,headTilt:s.id===9?-3:0});
   for(let i=0;i<this.flying.length;i++){
    const m=this.flying[i],u=((time*.23+i*.137)%1+1)%1;
    m.visible=s.id===1;
    const right=i%2?1:-1;m.position.set(right*(.65+u*1.3),3.8-u*3.4,-.1+Math.sin(i*1.4)*.7);
    m.rotation.set(.25+u*2.3,i*.7+u*2.5,Math.sin(i+u*4)*.3);
   }
   for(let i=0;i<this.officePiles.length;i++){const p=this.officePiles[i];p.rotation.z=s.id===1?.016*Math.sin(local*.75+i):0;}
  }
  if(this.street.visible){
   this.streetKing.mesh.visible=this.streetKing.blob.visible=s.id===3;this.streetFaulkner.mesh.visible=this.streetFaulkner.blob.visible=s.id===3;
   this.streetKing.update(camera,time,[-.95,0,.1],'neutral',{wave:s.id===3&&local<2.6?smooth(local/.6):undefined});
   this.streetFaulkner.update(camera,time,[1,0,-.35],'stern',{headTilt:2});
   this.streetVoters.forEach((a,i)=>{
    const x=s.id===3?(-2.8-(i%2)*.75):(-2.3+(i%2)*.7),z=s.id===3?-1.6-i*.7:1.4-i*.66;
    a.update(camera,time,[x,0,z],i===0?'neutral':'stern',{headTilt:i%2?2:-2});
   });
  }
  if(this.hall.visible){
   const clerkShock=s.id===5&&time>=27.8;
   this.hallClerk.update(camera,time,[-.72,0,-.72],clerkShock?'shock':'nervous',{headTilt:clerkShock?-5:0});
   this.hallFaulkner.update(camera,time,[2.05,0,-.65],s.id===6&&time>=28.598?'stern':'neutral',{headTilt:s.id===6?4*smooth((time-28.43)/.168):0});
   this.faulknerPile.scale.y=s.id===6?Math.max(.04,smooth((time-30.05)/.5)):1;
   this.hallPiles.forEach((p,i)=>{const progress=s.id===4?smooth((local-.4-i*.14)/1.1):1;p.scale.y=Math.max(.035,progress);});
   const extra=smooth((time-34.722)/.5);this.extraBundle.visible=s.id===7&&time>=34.722;this.extraBundle.position.y=2.5+(1-extra)*.55;this.extraBundle.rotation.z=(1-extra)*.14;
   this.hallVoters.forEach((a,i)=>{a.mesh.visible=a.blob.visible=s.id===4||s.id===7;a.update(camera,time,[-3.6+(i%2)*.6,0,1.8+i*.45],s.id===7&&time>=35.222?'shock':'neutral',{headTilt:i%2?2:-2});});
  }
  if(this.archive.visible){
   this.bookPage.rotation.z=Math.PI*smooth((local-.4)/1.8);
   this.outroBook.rotation.y=-.12;
  }
  return s;
 }
}
