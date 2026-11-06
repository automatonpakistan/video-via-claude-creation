"""Map preserved Piper phoneme samples to the approved spoken words; no audio synthesis."""
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parent
VOICE = ROOT / 'voice'
phonemes = json.loads((VOICE / 'phonemes.json').read_text())
timeline = json.loads((VOICE / 'timeline.json').read_text())
# These are observed coarticulated groups in THIS recording. Boundaries are
# placed on their original phoneme samples, never by splitting duration evenly.
splits = {4: {12: ['ðɛɹ', 'wˌɜː'], 15: ['ɪn', 'ðɪʲ']},
          5: {10: ['hɐv', 'bɪn']}}
all_words, validations, uncertain = [], [], []
for segment, beat in zip(phonemes, timeline):
    groups = []
    for chunk in segment['chunks']:
        current = []
        for a in chunk['alignments']:
            if a['phoneme'] == ' ':
                if current:
                    groups.append(current)
                    current = []
            elif a['phoneme'] not in ['^', '$', '.', ',', '?', '!', ':', ';']:
                current.append(a)
        if current:
            groups.append(current)
    lexical_groups = []
    for gi, group in enumerate(groups):
        pieces = splits.get(segment['segment'], {}).get(gi)
        if pieces:
            expected = ''.join(pieces)
            actual = ''.join(a['phoneme'] for a in group)
            assert actual == expected, (segment['segment'], gi, actual, expected)
            cursor = 0
            for piece in pieces:
                selected, joined = [], ''
                while joined != piece:
                    selected.append(group[cursor])
                    joined += group[cursor]['phoneme']
                    cursor += 1
                    assert piece.startswith(joined), (piece, joined)
                lexical_groups.append((selected, 'model-phoneme-boundary; coarticulated lexical split'))
            assert cursor == len(group)
        else:
            lexical_groups.append((group, 'model-phoneme-group'))
    spoken_words = beat['spoken_text'].split()
    original_words = beat['text'].split()
    assert len(spoken_words) == len(original_words) == len(lexical_groups), (segment['segment'], len(spoken_words), len(lexical_groups))
    for wi, (spoken, original, (group, method)) in enumerate(zip(spoken_words, original_words, lexical_groups)):
        record = {'word': original, 'spoken_word': spoken, 'start': group[0]['start'], 'end': group[-1]['end'],
                  'segment': segment['segment'], 'index': wi,
                  'phonemes': ''.join(a['phoneme'] for a in group), 'method': method,
                  'independently_verified': False}
        assert beat['start'] <= record['start'] < record['end'] <= beat['end'] + .001
        if all_words:
            assert all_words[-1]['end'] <= record['start'] + 1e-8
        all_words.append(record)
        if 'lexical split' in method:
            uncertain.append({'segment': segment['segment'], 'word': original, 'start': record['start'],
                              'limitation': 'Lexical boundary inferred from observed coarticulated phonemes; not independently ASR-verified.'})
    validations.append({'segment': segment['segment'], 'written_word_count': len(original_words),
                        'spoken_word_count': len(spoken_words), 'timed_word_count': len(lexical_groups),
                        'monotonic': True, 'within_segment_boundaries': True})
(VOICE / 'words.json').write_text(json.dumps(all_words, indent=2))
method = {'method': 'Piper 1.8 native phoneme sample durations, lexical mapping from actual space-delimited phoneme groups',
          'source': 'preserved voice/phonemes.json from original narration',
          'resampling': 'Original model phoneme durations in 22050Hz samples converted to seconds; preserved chunk and paragraph placement offsets.',
          'even_word_distribution_used': False, 'independent_ASR_verification': False,
          'manual_listening_verification': False,
          'pronunciation_expansion': {'D.': 'Dee', 'B.': 'Bee'},
          'coarticulation_cases': uncertain, 'validation': validations,
          'limitations': ['Model-derived durations are not independent ASR timings.',
                         'No auditory verification is claimed; pronunciation and full-mix listening remain a final QA requirement.']}
(VOICE / 'alignment-method.json').write_text(json.dumps(method, indent=2))
print(f'Aligned {len(all_words)} words in {len(validations)} segments; {len(uncertain)} explicitly marked coarticulated word boundaries.')
for word in all_words:
    if word['spoken_word'].strip('.,?!').lower() in ['sixteen','seventeen','faulkner','guinness','nine','world','record']:
        print(word['word'], round(word['start'],3), round(word['end'],3), 'segment',word['segment'])
