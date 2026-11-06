"""Original Liberia 1927 score and Foley; uses the preserved approved narration.

Reference approach: repository templates/audio DSP helpers (filters, additive
plucks, envelopes, stereo placement). This script contains its own score and
paper/breeze synthesis, and has no external audio samples or reference music.
"""
from pathlib import Path
import argparse, json, math, re, shutil, subprocess
import numpy as np
import soundfile as sf
from scipy import signal

parser = argparse.ArgumentParser()
parser.add_argument('--duration', type=float, default=46.4)
args = parser.parse_args()
ROOT = Path(__file__).resolve().parent
VOICE = ROOT / 'voice'
OUT = ROOT / 'audio'
OUT.mkdir(exist_ok=True)
SR = 48000
N = round(args.duration * SR)
R = np.random.default_rng(19270503)
TAU = 2 * np.pi

def bp(x, low, high):
    return signal.sosfilt(signal.butter(2, [low, high], btype='bandpass', fs=SR, output='sos'), x)

def lowpass(x, high):
    return signal.sosfilt(signal.butter(2, high, btype='lowpass', fs=SR, output='sos'), x)

def peak(x):
    return x / max(1e-9, np.max(np.abs(x)))

def faded(x, attack=.005, release=.035):
    x = x.copy()
    a,b = min(len(x),round(attack*SR)),min(len(x),round(release*SR))
    if a: x[:a] *= np.sin(np.linspace(0,np.pi/2,a)) ** 2
    if b: x[-b:] *= np.sin(np.linspace(np.pi/2,0,b)) ** 2
    return x

def place(buf, mono, time, gain, pan=0):
    start = round(time*SR)
    a,b = max(0,start),min(N,start+len(mono))
    if b<=a: return
    x = mono[a-start:b-start]*gain
    theta = (pan+1)*np.pi/4
    buf[a:b,0] += x*np.cos(theta)
    buf[a:b,1] += x*np.sin(theta)

def note(midi, dur=.72):
    t = np.arange(round(dur*SR))/SR
    f=440*2**((midi-69)/12)
    x=np.zeros_like(t)
    for h in range(1,9):
        x += np.sin(TAU*f*h*t + .17*h)/(h**1.65)*np.exp(-t/(.25/(h**.22)))
    return peak(faded(lowpass(x,3400),.003,.06))

def soft_tap(dur=.12):
    t=np.arange(round(dur*SR))/SR
    x=.65*np.sin(TAU*175*t)*np.exp(-t/.025)+bp(R.standard_normal(len(t)),700,2100)*np.exp(-t/.012)*.13
    return peak(faded(x,.001,.035))

def paper(dur=.45, strong=False):
    t=np.arange(round(dur*SR))/SR
    nz=bp(R.standard_normal(len(t)),850,7400)
    bumps=np.exp(-((t-dur*.24)/(.075 if strong else .05))**2)
    bumps+=.7*np.exp(-((t-dur*.6)/.045)**2)
    creases=bp(R.standard_normal(len(t)),2100,10500)*np.exp(-t/.022)*(.2 if strong else .07)
    return peak(faded(nz*bumps+creases,.012,.05))

voice, sr = sf.read(VOICE/'voice.wav',dtype='float64')
assert sr==SR and voice.ndim==1
assert len(voice)<=N
voice=np.pad(voice,(0,N-len(voice)))
music=np.zeros((N,2),dtype=np.float64)
effects=np.zeros_like(music)
cue_table=[]

# A new restrained G-minor pizzicato pattern, 88 bpm, not the Erfurt melody.
beat=60/88
melody=[55,62,58,65,63,58,60,57,55,62,65,67,63,62,60,62]
for i,time in enumerate(np.arange(.16,args.duration-.8,beat)):
    if 27.9<time<29.3: continue  # leave the Faulkner question exposed
    register=0 if time<37.95 else -12
    level=.026 if time<15.69 else .021
    place(music,note(melody[i%len(melody)]+register),float(time),level,(-.26 if i%2 else .26))
    if i%4==0:
        place(music,soft_tap(),float(time),.009,-.05)
        place(music,note([43,46,48,50][(i//4)%4],1.1),float(time),.015,0)
cue_table.append({'start':.16,'end':45.6,'event':'Original quiet G-minor plucked pattern,88bpm; gap for Faulkner question','type':'music'})
# Quiet G/Bb/D closing chord; voices stay present through the final spoken word.
for midi in [43,58,62]: place(music,note(midi,1.1),45.1,.012,0)

# Hook papers float in continuous arcs. These rustles describe movement only,
# not a claimed impact with the floor.
for i,time in enumerate(np.arange(.25,5.25,.47)):
    place(effects,paper(.36),float(time),.018,(-.4 if i%2 else .4))
cue_table.append({'start':.25,'end':5.3,'event':'Low paper flutter following the airborne sheets; no impact claim','type':'sfx'})

# Exterior air and distant surf: original band-limited noise, no sampled crowd.
outdoor_start,outdoor_end=5.416,15.694
dur=outdoor_end-outdoor_start
t=np.arange(round(dur*SR))/SR
air=lowpass(R.standard_normal(len(t)),750)
air*=.75+.25*np.sin(TAU*.16*t)
surf=bp(R.standard_normal(len(t)),100,380)*(.65+.35*np.sin(TAU*.105*t+.7))
air=peak(faded(air+.3*surf,.4,.5))
place(effects,air,outdoor_start,.008,-.18)
cue_table.append({'start':outdoor_start,'end':outdoor_end,'event':'Quiet coastal air and surf while outdoors','type':'ambience'})

# First row/column growth has the same easing duration and stagger as picture.
for i in range(16):
    center=16.644+i*.14
    place(effects,paper(.27),center-.135,.016,((i%4)-1.5)*.19)
cue_table.append({'start':16.509,'end':18.879,'event':'16 staggered paper shifts during first stack growth; centers16.644+i*0.14','type':'sfx'})

# Root's final timing lock: modest Faulkner pile, then a single extra bundle.
place(effects,paper(.4,True),30.15,.028,.38)
cue_table.append({'start':30.15,'end':30.55,'event':'Faulkner small pile settling/growing, ahead of nine at30.580','type':'sfx'})
place(effects,paper(.36,True),35.222,.027,.28)
cue_table.append({'start':35.222,'end':35.582,'event':'Single added paper bundle settles; seventeen cue35.289','type':'sfx'})

# Archive page turn: the hinge motion runs38.355–40.155.
page_dur=1.8
tt=np.arange(round(page_dur*SR))/SR
page=bp(R.standard_normal(len(tt)),1100,8000)*np.sin(np.pi*tt/page_dur)**1.7
page*=.7+.3*np.sin(TAU*3.4*tt)
place(effects,peak(faded(page,.06,.16)),38.355,.025,-.18)
cue_table.append({'start':38.355,'end':40.155,'event':'Archive page turn at corrected hinge, same1.8s window','type':'sfx'})

# Word-driven 5dB ducking, softened with a 25ms moving average. The exact
# model-derived words come from the preserved native phoneme sample durations.
# Source levels are calibrated to keep this restrained score about17dB below
# narration RMS; the standard +3/-6dB balance and speech ducking follow below.
music *= 3.5
effects *= 8
words=json.loads((VOICE/'words.json').read_text())
active=np.zeros(N,dtype=np.float64)
for word in words:
    a=max(0,round((word['start']-.08)*SR));b=min(N,round((word['end']+.12)*SR))
    active[a:b]=1
width=round(.025*SR)
active=np.convolve(active,np.ones(width)/width,mode='same')
duck=10**(-5*active/20)
fade=np.ones(N)
end=round(.48*SR)
fade[-end:]=np.sin(np.linspace(np.pi/2,0,end))**2
music*=duck[:,None]*fade[:,None]*10**(3/20)
effects*=duck[:,None]*fade[:,None]*10**(-6/20)
premaster=np.repeat((voice*.86)[:,None],2,axis=1)+music+effects
sf.write(OUT/'voice.wav',voice,SR,subtype='PCM_24')
sf.write(OUT/'music.wav',music,SR,subtype='PCM_24')
sf.write(OUT/'effects.wav',effects,SR,subtype='PCM_24')
sf.write(OUT/'premaster.wav',premaster,SR,subtype='PCM_24')
(OUT/'cues.json').write_text(json.dumps(cue_table,indent=2))
(OUT/'cues.md').write_text('# Original sound cues\n\n| Start | End | Event |\n|---:|---:|---|\n'+''.join(f"| {c['start']:.3f} | {c['end']:.3f} | {c['event']} |\n" for c in cue_table))

def ffmpeg_measure(path):
    result=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(path),'-af',
                           'loudnorm=I=-15:TP=-1.5:LRA=7:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    matches=re.findall(r'\{[^{}]*"input_i"[^{}]*\}',result.stderr,re.S)
    assert matches,result.stderr
    return json.loads(matches[-1]),result.stderr

measure,log=ffmpeg_measure(OUT/'premaster.wav')
(OUT/'loudness-pass1.log').write_text(log)
filt='loudnorm=I=-15:TP=-1.5:LRA=7:'+':'.join([
    'measured_I='+measure['input_i'],'measured_TP='+measure['input_tp'],
    'measured_LRA='+measure['input_lra'],'measured_thresh='+measure['input_thresh'],
    'offset='+measure['target_offset'],'linear=true','print_format=json'])
result=subprocess.run(['ffmpeg','-y','-hide_banner','-nostats','-i',str(OUT/'premaster.wav'),'-af',filt,
                       '-ar','48000','-c:a','pcm_s24le',str(OUT/'mix.wav')],capture_output=True,text=True,check=True)
(OUT/'loudness-pass2.log').write_text(result.stderr)
applied=json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}',result.stderr,re.S)[-1])
final,log=ffmpeg_measure(OUT/'mix.wav')
(OUT/'loudness-final.log').write_text(log)
data,sr=sf.read(OUT/'mix.wav')
assert sr==48000 and data.shape==(N,2)
assert np.isfinite(data).all() and np.max(np.abs(data))<1
report={'duration':N/SR,'sample_rate':SR,'channels':2,'subtype':'PCM_24','samples':N,
        'source_voice':'Existing approved native Piper en_US-ryan-high recording; no regeneration',
        'music':'Original G-minor pizzicato,88bpm; seed19270503',
        'sfx':'Original procedural paper movement and coastal ambience; no external samples',
        'word_ducking_db':5,'music_standard_offset_db':3,'sfx_standard_offset_db':-6,
        'score_source_calibration_gain':3.5,'foley_source_calibration_gain':8,
        'voice_premaster_gain':.86,'premaster_peak_dbfs':float(20*np.log10(np.max(np.abs(premaster)))),
        'master_peak_dbfs':float(20*np.log10(np.max(np.abs(data)))),
        'measured_premaster':measure,'measured_master':final,'applied_normalization':applied,
        'stem_rms_dbfs':{name:float(20*np.log10(np.sqrt(np.mean(x*x))+1e-12)) for name,x in [('voice',voice),('music',music),('effects',effects)]},
        'source_voice_sample_identity_verified':bool(np.array_equal(sf.read(VOICE/'voice.wav')[0],voice[:len(sf.read(VOICE/'voice.wav')[0])])),
        'manual_listening_verified':False,
        'limitations':['The full mix and pronunciation still need auditory review; no manual listening is claimed.',
                       'Word timings are model-derived, with six coarticulated lexical boundaries explicitly flagged.']}
(OUT/'audio-qa.json').write_text(json.dumps(report,indent=2))
project=ROOT.parents[1]
public=project/'public/audio'
public.mkdir(parents=True,exist_ok=True)
shutil.copy2(OUT/'mix.wav',public/'liberia-1927-mix.wav')
# FLAC preserves exactly the original samples while reducing upload size.
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(OUT/'mix.wav'),'-c:a','flac',
                str(OUT/'mix.flac')],check=True)
print(json.dumps(report,indent=2))
