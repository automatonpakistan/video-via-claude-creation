import React from 'react';
import {Composition} from 'remotion';
import {LiberiaShort} from './videos/liberia-1927/Liberia';
import {TOTAL_FRAMES} from './videos/liberia-1927/story';
export const Root: React.FC = () => <Composition id="Liberia1927" component={LiberiaShort} durationInFrames={TOTAL_FRAMES} fps={30} width={1080} height={1920}/>;
