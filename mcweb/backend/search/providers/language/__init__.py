import fasttext
from typing import List
import os

# this install.sh script will have downloaded and moved this to the proper place
MODEL_NAME = 'lid.176.bin'

this_dir = os.path.dirname(os.path.realpath(__file__))

try:
    model = fasttext.load_model(os.path.join(this_dir, MODEL_NAME))
except ValueError:
    raise ValueError("Couldn't load fasttext lang detection model - make sure install.sh ran and saved to {}".format(
        os.path.join(this_dir, MODEL_NAME)))


def detect(text: str) -> List:
    cleaned_text = text.replace('\n', '')
    return model.predict([cleaned_text])  # [['__label__en']], [array([0.9331119], dtype=float32)]


def top_detected(text: str) -> str:
    guesses = detect(text)
    return guesses[0][0][0].replace('__label__', '')
