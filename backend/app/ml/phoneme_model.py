from __future__ import annotations

import io

import librosa
from app.ml.audio_converter import convert_audio_to_wav
import numpy as np
import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor


class PhonemeModel:
    TARGET_SAMPLE_RATE: int = 16_000

    def __init__(self, model_name: str = "facebook/wav2vec2-lv-60-espeak-cv-ft") -> None:
        self._processor = Wav2Vec2Processor.from_pretrained(model_name)
        self._model = Wav2Vec2ForCTC.from_pretrained(model_name)
        self._model.eval()

    def predict(self, audio_bytes: bytes) -> list[str]:
        audio_bytes = convert_audio_to_wav(audio_bytes)
        audio_array, original_sr = librosa.load(
            io.BytesIO(audio_bytes), sr=None, mono=True
        )

        if original_sr != self.TARGET_SAMPLE_RATE:
            audio_array = librosa.resample(
                audio_array,
                orig_sr=original_sr,
                target_sr=self.TARGET_SAMPLE_RATE,
            )

        audio_array = audio_array.astype(np.float32)

        inputs = self._processor(
            audio_array,
            sampling_rate=self.TARGET_SAMPLE_RATE,
            return_tensors="pt",
        )

        with torch.no_grad():
            logits = self._model(**inputs).logits

        predicted_ids = torch.argmax(logits, dim=-1)
        transcription: str = self._processor.batch_decode(predicted_ids)[0]

        return transcription.strip().split()


def load_phoneme_model(
    model_name: str = "facebook/wav2vec2-lv-60-espeak-cv-ft",
) -> PhonemeModel:
    return PhonemeModel(model_name)
