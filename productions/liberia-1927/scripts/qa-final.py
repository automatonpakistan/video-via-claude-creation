"""Decode every frame, measure continuity and AAC loudness, and record limits."""
from pathlib import Path
import sys,json,subprocess,re,math

video=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
def run(args):return subprocess.run(args,capture_output=True,text=True,check=True)
probe=json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(video)]).stdout)
vs=[s for s in probe['streams'] if s['codec_type']=='video'];audio=[s for s in probe['streams'] if s['codec_type']=='audio']
assert len(vs)==1 and len(audio)==1,'Expected exactly one video and one audio stream'
v=vs[0];assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_read_frames']))==(1440,2560,'30/1',1392),v
assert audio[0]['sample_rate']=='48000' and audio[0]['channels']==2,audio
decode=run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'])
pixels=32*56
proc=subprocess.Popen(['ffmpeg','-v','error','-i',str(video),'-map','0:v:0','-vf','scale=32:56:flags=area,format=gray','-f','rawvideo','-'],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
metrics=[];previous=None
while True:
    frame=proc.stdout.read(pixels)
    if not frame:break
    assert len(frame)==pixels,'Truncated raw frame'
    mean=sum(frame)/pixels;variance=sum((x-mean)**2 for x in frame)/pixels
    diff=None if previous is None else sum(abs(a-b) for a,b in zip(frame,previous))/pixels
    metrics.append({'frame':len(metrics),'mean':round(mean,4),'std':round(math.sqrt(variance),4),'mean_absolute_change':None if diff is None else round(diff,4)})
    previous=frame
stderr=proc.stderr.read().decode();assert proc.wait()==0,stderr
assert len(metrics)==1392,len(metrics)
cuts=[163,294,471,659,852,946,1139,1292]
near_cut=lambda f:any(abs(f-c)<=2 for c in cuts)
black=[m['frame'] for m in metrics if m['mean']<3 and m['std']<3]
white=[m['frame'] for m in metrics if m['mean']>250 and m['std']<3]
jumps=[m for m in metrics if m['mean_absolute_change'] is not None and m['mean_absolute_change']>30 and not near_cut(m['frame'])]
freeze_spans=[];start=None
for i,m in enumerate(metrics+[{'mean_absolute_change':999,'frame':len(metrics)}]):
    quiet=m['mean_absolute_change'] is not None and m['mean_absolute_change']<.065 and not near_cut(i)
    if quiet and start is None:start=i
    if not quiet and start is not None:
        if i-start>=12:freeze_spans.append({'start_frame':start,'end_frame':i-1,'frames':i-start})
        start=None
loud=run(['ffmpeg','-hide_banner','-i',str(video),'-af','loudnorm=I=-15:TP=-1.5:LRA=7:print_format=json','-f','null','-']).stderr
match=re.findall(r'\{\s*"input_i".*?\}',loud,re.S);assert match,'Missing loudness measurement'
loudness=json.loads(match[-1]);(out/'aac-loudness.txt').write_text(loud)
report={'video':video.name,'verified':{'decoded_every_frame':True,'frames':len(metrics),'width':1440,'height':2560,'fps':30,'duration_seconds':float(probe['format']['duration']),'audio_channels':2,'audio_sample_rate':48000},'black_frames':black,'white_frames':white,'unexpected_large_changes':jumps,'near_static_spans':freeze_spans,'expected_scene_cut_frames':cuts,'aac_loudness':loudness,'limitations':['Statistical image checks flag candidates; they do not establish artistic motion quality or speech intelligibility.','Human review is still required for gesture, page-turn, pronunciation, and effect synchronization.'],'critical_pass':not black and not white and abs(float(loudness['input_i'])+15)<1 and float(loudness['input_tp'])<-.3}
(out/'frame-metrics.json').write_text(json.dumps(metrics,separators=(',',':')))
(out/'qa.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
assert report['critical_pass'],'Critical final QA failed; inspect qa.json'
