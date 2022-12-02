import os
from typing import List

this_dir = os.path.dirname(os.path.realpath(__file__))

# manage this like a lazy-loaded singleton so it is fast after the first time
_stopwords_by_language = {}


def _for_language(lang_code: str) -> List:
    # manage the _stopwords_by_language dict, from alpha2 to list
    if len(lang_code) != 2:
        raise RuntimeError('Invalid language - use 2 letter alpha code')
    if lang_code not in _stopwords_by_language:
        file_path = os.path.join(this_dir, '{}_stop_words.txt'.format(lang_code))
        if not os.path.exists(file_path):
            raise RuntimeError('Language has no stopwords list')
        with open(file_path) as f:
            lines = f.read().splitlines()
            _stopwords_by_language[lang_code] = [line.strip() for line in lines
                                                 if not line.startswith('#') and len(line) > 0]
    return _stopwords_by_language[lang_code]


def remove_from_counter(language: str, counter):
    stopwords = _for_language(language)
    for word in stopwords:
        if word in counter:
            del counter[word]
    return counter
