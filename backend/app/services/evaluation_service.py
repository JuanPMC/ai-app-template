from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.error_map import ERROR_MAP, ERROR_MAP_ES
from app.ml.phoneme_model import PhonemeModel
from app.schemas.evaluation import EvaluationResponse, PhonemeResult
from app.services.dictionary_service import get_word_by_id

_LANG_MAP: dict[str, dict[str, str]] = {
    "en": ERROR_MAP,
    "es": ERROR_MAP_ES,
}


async def evaluate_pronunciation(
    audio_bytes: bytes,
    word_id: int,
    db: AsyncSession,
    model: PhonemeModel,
    lang: str = "en",
) -> EvaluationResponse:
    word = await get_word_by_id(word_id, db)

    try:
        user_phonemes: list[str] = model.predict(audio_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Audio processing failed: {exc}",
        )

    error_map = _LANG_MAP.get(lang, ERROR_MAP_ES)
    target_phonemes: list[str] = word.ipa
    results: list[PhonemeResult] = []

    for i, target in enumerate(target_phonemes):
        if i < len(user_phonemes):
            produced = user_phonemes[i]
            correct = produced == target
            hint = None if correct else error_map.get(f"{target}_{produced}")
        else:
            correct = False
            hint = None

        results.append(PhonemeResult(phoneme=target, correct=correct, hint=hint))

    return EvaluationResponse(
        word_id=word.id,
        word_text=word.text,
        results=results,
        all_correct=all(r.correct for r in results),
    )
