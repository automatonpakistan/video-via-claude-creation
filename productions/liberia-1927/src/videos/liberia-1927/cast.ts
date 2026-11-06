import * as THREE from 'three';
import {Pen,bodyFront,Outfit,Expr,FrontOpts} from './toon';
import {NOINK} from './ink';
import {cardShade,CARD_K} from './cardshade';
export const KING:Outfit={jacket:'#343e50',pants:'#343948',boots:'#241726',skin:'#956c59',hat:'hair',hair:'#5b5556',moustache:'#65504b',formal:true,tie:'#95484d',buttons:'#c7ac6b',head:13,build:'stout'};
export const FAULKNER:Outfit={jacket:'#41657e',pants:'#3a4c63',boots:'#241726',skin:'#ac8067',hat:'hair',hair:'#342c30',formal:true,tie:'#c69a43',spectacles:true,buttons:'#c0cbd0',head:27};
export const CLERK:Outfit={jacket:'#63856e',pants:'#434b57',boots:'#241726',skin:'#996f5a',hat:'hair',hair:'#332b2e',formal:true,tie:'#654451',buttons:'#a4b79d',head:8};
export const citizen=(i:number):Outfit=>({jacket:['#bf8b51','#687b95','#ac6160','#648778','#9e795b'][i%5],pants:'#4d4b59',boots:'#2e2631',skin:['#9c6646','#ba8157','#8c5e44','#ad754f'][i%4],hat:i%4===0?'cap':'hair',cap:'#d1b890',hair:'#3b2b2c',formal:i%3===0,tie:'#796054',head:i+31});
const textures=new Map<string,THREE.CanvasTexture>();
function draw(outfit:Outfit,expr:Expr,options:FrontOpts){
 const key=JSON.stringify([outfit,expr,options]);if(textures.has(key))return textures.get(key)!;
 const cv=document.createElement('canvas');cv.width=600;cv.height=1000;
 const p=new Pen(cv.getContext('2d')!);bodyFront(p,outfit,{mode:'stand',expr,seed:outfit.head??1,...options});
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
 textures.set(key,t);if(textures.size>500){const k=textures.keys().next().value!;textures.get(k)?.dispose();textures.delete(k);}return t;
}
const body=new THREE.PlaneGeometry(1.296,2.16);body.translate(0,1.026,0);
const shadowTexture=()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d')!,r=g.createRadialGradient(64,64,1,64,64,64);r.addColorStop(0,'rgba(37,28,43,.32)');r.addColorStop(1,'rgba(37,28,43,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);};
export class Actor {
 mesh:THREE.Mesh;mat:THREE.MeshLambertMaterial;depth:THREE.MeshDepthMaterial;blob:THREE.Mesh;outfit:Outfit;index:number;
 constructor(parent:THREE.Group,outfit:Outfit,index:number){
  this.outfit=outfit;this.index=index;
  this.mat=cardShade(new THREE.MeshLambertMaterial({map:draw(outfit,'neutral',{}),alphaTest:.5,side:THREE.DoubleSide}));
  this.depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:this.mat.map,alphaTest:.5,side:THREE.DoubleSide});
  this.mesh=new THREE.Mesh(body,this.mat);this.mesh.customDepthMaterial=this.depth;this.mesh.layers.set(NOINK);this.mesh.receiveShadow=true;this.mesh.castShadow=true;this.mesh.renderOrder=2;
  this.mesh.scale.setScalar(1.25);
  this.mesh.onBeforeRender=(renderer)=>{const rt=renderer.getRenderTarget();CARD_K.uPx.value=(rt?rt.height:renderer.domElement.height)/1920;};parent.add(this.mesh);
  this.blob=new THREE.Mesh(new THREE.PlaneGeometry(.75,.45),new THREE.MeshBasicMaterial({map:shadowTexture(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
  this.blob.rotation.x=-Math.PI/2;this.blob.layers.set(NOINK);parent.add(this.blob);
 }
 update(camera:THREE.PerspectiveCamera,time:number,position:[number,number,number],expr:Expr='neutral',options:FrontOpts={}){
  const n=Math.floor((time+.41*this.index)*30)%Math.round(34+(this.index%7)*5),lid=n<4?[.5,1,1,.5][n]:0;
  const tex=draw(this.outfit,expr,{blink:lid,light:-.85,...options});this.mat.map=tex;this.depth.map=tex;
  this.mesh.position.set(...position);this.mesh.rotation.y=Math.atan2(camera.position.x-position[0],camera.position.z-position[2]);
  this.blob.position.set(position[0],position[1]+.014,position[2]);
 }
}
