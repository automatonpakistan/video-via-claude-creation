import React,{useMemo,useEffect} from 'react';
import * as THREE from 'three';
import {AbsoluteFill,useCurrentFrame,getInputProps} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BloomEffect,BlendFunction,ToneMappingEffect,ToneMappingMode} from 'postprocessing';
import {World} from './world';
import {InkPass,noInkFallback} from './ink';
import {LensBlur} from './lensblur';
import {GradeEffect,GRADES,GRADE_STRENGTH,gradeFor} from './grade';
const Inner:React.FC=()=>{
 const frame=useCurrentFrame(),{camera,scene}=useThree(),cam=camera as THREE.PerspectiveCamera;
 const world=useMemo(()=>new World(),[]);
 const fx=useMemo(()=>({ink:new InkPass(scene,cam,{widthNear:3.8,widthFar:2.8}),lens:new LensBlur({maxCoC:24,nearScale:1.1}),bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.4,luminanceThreshold:1,luminanceSmoothing:.2,mipmapBlur:true,levels:5,radius:.6}),tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),grade:new GradeEffect(GRADES.day,GRADE_STRENGTH.day)}),[cam,scene]);
 useEffect(()=>()=>fx.ink.dispose(),[fx]);
 const shot=world.update(frame,cam,scene);noInkFallback(world.root);
 const target=new THREE.Vector3(...shot.look),direction=new THREE.Vector3();cam.getWorldDirection(direction);
 fx.lens.focus=Math.max(.3,target.sub(cam.position).dot(direction));fx.lens.cInf=shot.coc;gradeFor(fx.grade,shot.light);
 return <><primitive object={world.root}/><EffectComposer multisampling={4}><primitive object={fx.ink} dispose={null}/><primitive object={fx.lens.pre} dispose={null}/><primitive object={fx.lens.main} dispose={null}/><primitive object={fx.bloom} dispose={null}/><primitive object={fx.tone} dispose={null}/><primitive object={fx.grade} dispose={null}/></EffectComposer></>;
};
export const LiberiaShort:React.FC=()=>{
 const props=getInputProps() as {previewDpr?:number;renderDpr?:number;requireNative?:boolean};
 const dpr=props.previewDpr??props.renderDpr??1;
 return <AbsoluteFill style={{background:'#b8d0ec'}}><ThreeCanvas width={1080} height={1920} dpr={dpr} onCreated={({gl})=>{
  const size=gl.getDrawingBufferSize(new THREE.Vector2());console.log('LIBERIA_NATIVE_BUFFER',JSON.stringify({width:size.x,height:size.y,dpr:gl.getPixelRatio(),preview:!!props.previewDpr}));
  if(props.requireNative&&(size.x<1440||size.y<2560))throw new Error(`Final drawing buffer is ${size.x}x${size.y}; native 1440x2560 required`);
 }} shadows camera={{fov:40,near:.2,far:600}} gl={{antialias:false,stencil:false,powerPreference:'high-performance'}}><Inner/></ThreeCanvas></AbsoluteFill>;
};
