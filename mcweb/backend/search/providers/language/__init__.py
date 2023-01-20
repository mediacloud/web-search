import fasttext
from typing import List
import os
import logging

logger = logging.getLogger(__name__)

# this install.sh script will have downloaded and moved this to the proper place
MODEL_NAME = 'lid.176.bin'

this_dir = os.path.dirname(os.path.realpath(__file__))

# manage this like a lazy-loaded singleton so it is fast after the first time
_stopwords_by_language = {}


fasttext_model = None


def _get_model():
    try:
        global fasttext_model
        if fasttext_model is None:
            fasttext_model = fasttext.load_model(os.path.join(this_dir, MODEL_NAME))
        return fasttext_model
    except ValueError:
        raise ValueError("Couldn't load fasttext lang detection model - make sure install.sh ran and saved to {}".format(
            os.path.join(this_dir, MODEL_NAME)))


def detect(text: str) -> List:
    cleaned_text = text.replace('\n', '')
    return _get_model().predict([cleaned_text])  # [['__label__en']], [array([0.9331119], dtype=float32)]


def top_detected(text: str) -> str:
    guesses = detect(text)
    return guesses[0][0][0].replace('__label__', '')


def stopwords_for_language(lang_code: str) -> List:
    # manage the _stopwords_by_language dict, from alpha2 to list
    if len(lang_code) != 2:
        raise RuntimeError('Invalid language "{}" - use 2 letter alpha code'.format(lang_code))
    if lang_code not in _stopwords_by_language:
        file_path = os.path.join(this_dir, '{}_stop_words.txt'.format(lang_code))
        if not os.path.exists(file_path):
            logger.info('Language "{}" has no stopwords list, accepting all terms'.format(lang_code))
            return []
        with open(file_path) as f:
            lines = f.read().splitlines()
            _stopwords_by_language[lang_code] = [line.strip() for line in lines
                                                 if not line.startswith('#') and len(line) > 0]
    return _stopwords_by_language[lang_code]


def terms_without_stopwords(lang_code: str, text: str) -> List[str]:
    try:
        lang_stopwords = stopwords_for_language(lang_code)
    except RuntimeError:
        # no stopwords for this language, so just let them all through
        logger.info(f"No stopwords for {lang_code}")
        lang_stopwords = []
    terms = text.split()
    ok_terms = [w.lower() for w in terms if w.lower() not in lang_stopwords]
    return ok_terms

"""
def remove_stopwords_from_counter(lang_code: str, counter):
    stopwords = _stopwords_for_language(lang_code)
    for word in stopwords:
        if word in counter:
            del counter[word]
    return counter
"""