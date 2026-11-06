from pathlib import Path
from dataclasses import asdict
import json, math, hashlib
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from piper import PiperVoice, SynthesisConfig

ROOT = Path('/workspace/shorts-dev')
OUT = ROOT / 'work/liberia-1927/voice'
OUT.mkdir(parents=True, exist_ok=True)
MODEL = ROOT / 'work/voice/model/vits-piper-en_US-ryan-high/en_US-ryan-high.onnx'
script = (ROOT / 'work/liberia-1927/SCRIPT.md').read_text()
text = script.split('## Narration draft\n\n')[1].split('\n## Production gate')[0].strip()
paragraphs = text.split('\n\n')
spoken = [s.replace('D. B.', 'Dee Bee') for s in paragraphs]
(OUT / 'approved-script.txt').write_text(text + '\n')
(OUT / 'pronunciation-expanded.txt').write_text('\n\n'.join(spoken) + '\n')
voice = PiperVoice.load(MODEL, include_alignments=True)
sr_out = 48000
parts = [np.zeros(round(.08 * sr_out), dtype=np.float32)]
cursor = len(parts[0])
timeline, phonemes, raw_segments = [], [], []
for i, (original, speech) in enumerate(zip(paragraphs, spoken)):
    chunks = list(voice.synthesize(speech, SynthesisConfig(length_scale=1.2), include_alignments=True))
    audio_chunks, chunk_records = [], []
    local_cursor = 0
    for ci, chunk in enumerate(chunks):
        sr = chunk.sample_rate
        ratio = math.gcd(sr_out, sr)
        data = resample_poly(chunk.audio_float_array, sr_out // ratio, sr // ratio).astype(np.float32)
        audio_chunks.append(data)
        position = 0
        aligned = []
        if chunk.phoneme_alignments is None:
            raise RuntimeError('Piper returned no phoneme alignments')
        for a in chunk.phoneme_alignments:
            record = {'phoneme': a.phoneme, 'phoneme_ids': list(a.phoneme_ids), 'num_samples': int(a.num_samples),
                      'start': (cursor + local_cursor) / sr_out + position / sr,
                      'end': (cursor + local_cursor) / sr_out + (position + a.num_samples) / sr}
            position += a.num_samples
            aligned.append(record)
        chunk_records.append({'chunk': ci, 'sample_rate': sr, 'original_samples': len(chunk.audio_float_array),
                              'start': (cursor + local_cursor) / sr_out, 'phonemes': chunk.phonemes,
                              'phoneme_id_samples': chunk.phoneme_id_samples.tolist() if chunk.phoneme_id_samples is not None else None,
                              'alignments': aligned})
        local_cursor += len(data)
    paragraph_audio = np.concatenate(audio_chunks)
    sf.write(OUT / f'segment-{i+1:02d}.wav', paragraph_audio, sr_out, subtype='PCM_24')
    timeline.append({'id': i+1, 'text': original, 'spoken_text': speech, 'start': cursor / sr_out,
                     'end': (cursor + len(paragraph_audio)) / sr_out, 'duration': len(paragraph_audio) / sr_out})
    phonemes.append({'segment': i+1, 'chunks': chunk_records})
    parts.append(paragraph_audio)
    cursor += len(paragraph_audio)
    if i < len(paragraphs)-1:
        gap = np.zeros(round(.1 * sr_out), dtype=np.float32)
        parts.append(gap)
        cursor += len(gap)
    print(f'Segment {i+1}: {timeline[-1]["start"]:.3f}–{timeline[-1]["end"]:.3f}s', flush=True)
parts.append(np.zeros(round(.12 * sr_out), dtype=np.float32))
audio = np.concatenate(parts)
peak = float(np.max(np.abs(audio)))
gain = min(1.0, 10 ** (-3 / 20) / peak)
audio *= gain
sf.write(OUT / 'voice.wav', audio, sr_out, subtype='PCM_24')
for name, data in [('timeline.json', timeline), ('phonemes.json', phonemes)]:
    (OUT / name).write_text(json.dumps(data, indent=2))
provenance = {'engine': 'native Piper', 'version': '1.8.0', 'model': 'en_US-ryan-high',
              'model_sha256': hashlib.sha256(MODEL.read_bytes()).hexdigest(), 'length_scale': 1.2,
              'other_synthesis_settings': 'Piper defaults', 'pronunciation_expansion': 'D. B. -> Dee Bee',
              'output_sample_rate': sr_out, 'subtype': 'PCM_24', 'channels': 1,
              'duration': len(audio) / sr_out, 'raw_peak': peak, 'uniform_gain': gain,
              'peak_dbfs': 20 * math.log10(float(np.max(np.abs(audio))))}
(OUT / 'provenance.json').write_text(json.dumps(provenance, indent=2))
print(json.dumps(provenance, indent=2), flush=True)
