from __future__ import annotations

from functools import lru_cache
from typing import Literal

import eng_to_ipa as ipa
import nltk
import spacy
from fastapi import FastAPI
from nltk.corpus import wordnet as wn
from nltk.corpus.reader.wordnet import WordNetError
from pydantic import BaseModel, Field


def ensure_nltk_data() -> None:
    packages = ("wordnet", "omw-1.4")
    for package in packages:
        try:
            nltk.data.find(f"corpora/{package}")
        except LookupError:
            nltk.download(package, quiet=True)


ensure_nltk_data()


@lru_cache(maxsize=1)
def get_nlp():
    return spacy.load("en_core_web_sm")


def normalize_pos(token_pos: str) -> str:
    mapping = {
        "NOUN": "noun",
        "PROPN": "proper noun",
        "VERB": "verb",
        "AUX": "verb",
        "ADJ": "adjective",
        "ADV": "adverb",
        "PRON": "pronoun",
        "ADP": "preposition",
        "CCONJ": "conjunction",
        "SCONJ": "conjunction",
        "DET": "determiner",
        "NUM": "number",
        "PART": "particle",
        "INTJ": "interjection",
    }
    return mapping.get(token_pos, token_pos.lower())


def wordnet_pos(token_pos: str):
    mapping = {
        "NOUN": wn.NOUN,
        "PROPN": wn.NOUN,
        "VERB": wn.VERB,
        "AUX": wn.VERB,
        "ADJ": wn.ADJ,
        "ADV": wn.ADV,
    }
    return mapping.get(token_pos)


def build_examples(text: str, lemma: str, token_pos: str) -> list[str]:
    synsets = wn.synsets(lemma or text, pos=wordnet_pos(token_pos))
    examples: list[str] = []

    for synset in synsets:
        for example in synset.examples():
            if example not in examples:
                examples.append(example)
            if len(examples) >= 2:
                return examples

    if examples:
        return examples

    fallback_word = text.strip()
    if not fallback_word:
        return []

    return [
        f"The term {fallback_word} is often used in academic English.",
        f"Students should understand how {fallback_word} is used in context.",
    ]


class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=200)


class TokenItem(BaseModel):
    text: str
    lemma: str
    pos: str


class ExampleItem(BaseModel):
    english_text: str


class RelatedFormItem(BaseModel):
    word: str
    part_of_speech: str


class SynonymItem(BaseModel):
    word: str


class AnalyzeResponse(BaseModel):
    word: str
    normalized_text: str
    part_of_speech: str
    lemma: str
    ipa: str
    tokens: list[TokenItem]
    english_definition: str
    vietnamese_meanings: list[str]
    related_forms: list[RelatedFormItem]
    synonyms: list[SynonymItem]
    examples: list[ExampleItem]
    model: Literal["spacy_en_core_web_sm"] = "spacy_en_core_web_sm"


def normalize_phrase(value: str) -> str:
    return value.replace("_", " ").strip()


def unique_in_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []

    for value in values:
        normalized = normalize_phrase(value)
        key = normalized.lower()
        if not normalized or key in seen:
            continue
        seen.add(key)
        ordered.append(normalized)

    return ordered


def build_vietnamese_meanings(text: str, lemma: str, token_pos: str) -> list[str]:
    candidates: list[str] = []
    search_terms = [text.strip(), lemma.strip()]
    synsets = wn.synsets(lemma or text, pos=wordnet_pos(token_pos))

    for synset in synsets[:5]:
        try:
            candidates.extend(synset.lemma_names("vie"))
        except WordNetError:
            break

    # Backfill with multilingual lookup on the original surface form.
    for search_term in search_terms:
        if not search_term:
            continue
        for synset in wn.synsets(search_term, pos=wordnet_pos(token_pos))[:3]:
            try:
                candidates.extend(synset.lemma_names("vie"))
            except WordNetError:
                break

    return unique_in_order(candidates)


def score_synset(synset, text: str, lemma: str, token_pos: str) -> float:
    score = 0.0
    normalized_surface = text.strip().lower()
    normalized_lemma = lemma.strip().lower()
    normalized_names = [normalize_phrase(name).lower() for name in synset.lemma_names()]

    if normalized_surface in normalized_names:
        score += 6
    if normalized_lemma in normalized_names:
        score += 5
    if wordnet_pos(token_pos) == synset.pos():
        score += 4

    score += sum(lemma_item.count() for lemma_item in synset.lemmas()) * 0.35
    score += max(0, 5 - min(synset.lexname().count('.'), 4)) * 0.05

    return score


def ranked_synsets(text: str, lemma: str, token_pos: str):
    collected: dict[str, tuple[float, object]] = {}
    search_terms = [term for term in [text.strip(), lemma.strip()] if term]

    for search_term in search_terms:
        for synset in wn.synsets(search_term):
            key = synset.name()
            score = score_synset(synset, text, lemma, token_pos)
            existing = collected.get(key)
            if existing is None or score > existing[0]:
                collected[key] = (score, synset)

    ranked = sorted(collected.values(), key=lambda item: item[0], reverse=True)
    return [synset for _, synset in ranked]


def normalize_wordnet_pos(pos: str) -> str:
    mapping = {
        "n": "noun",
        "v": "verb",
        "a": "adjective",
        "s": "adjective",
        "r": "adverb",
    }
    return mapping.get(pos, pos)


def build_related_forms(text: str, lemma: str, token_pos: str) -> list[RelatedFormItem]:
    current_pos = normalize_pos(token_pos)
    normalized_surface = text.strip().lower()
    normalized_lemma = lemma.strip().lower()

    collected: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()

    for synset in ranked_synsets(text, lemma, token_pos)[:8]:
        candidate_pos = normalize_wordnet_pos(synset.pos())
        for lemma_name in synset.lemma_names():
            normalized_name = normalize_phrase(lemma_name)
            key = (normalized_name.lower(), candidate_pos)
            if candidate_pos != current_pos and normalized_name.lower() in {normalized_surface, normalized_lemma} and key not in seen:
                seen.add(key)
                collected.append((normalized_name, candidate_pos))

        for lemma_item in synset.lemmas():
            for related in lemma_item.derivationally_related_forms():
                related_word = normalize_phrase(related.name())
                related_pos = normalize_wordnet_pos(related.synset().pos())
                key = (related_word.lower(), related_pos)

                if (
                    not related_word
                    or related_word.lower() in {normalized_surface, normalized_lemma}
                    or related_pos == current_pos
                    or key in seen
                ):
                    continue

                seen.add(key)
                collected.append((related_word, related_pos))

    return [
        RelatedFormItem(word=word, part_of_speech=part_of_speech)
        for word, part_of_speech in collected[:8]
    ]


def build_synonyms(text: str, lemma: str, token_pos: str) -> list[SynonymItem]:
    current_pos = normalize_pos(token_pos)
    normalized_surface = text.strip().lower()
    normalized_lemma = lemma.strip().lower()
    seen: set[str] = set()
    synonyms: list[SynonymItem] = []

    for synset in ranked_synsets(text, lemma, token_pos)[:6]:
        if normalize_wordnet_pos(synset.pos()) != current_pos:
            continue

        for lemma_name in synset.lemma_names():
            candidate = normalize_phrase(lemma_name)
            key = candidate.lower()

            if (
                not candidate
                or key in seen
                or key in {normalized_surface, normalized_lemma}
            ):
                continue

            seen.add(key)
            synonyms.append(SynonymItem(word=candidate))

            if len(synonyms) >= 8:
                return synonyms

    return synonyms


app = FastAPI(title="NLP Service", version="1.0.0")


@app.get("/")
async def root():
    return {"message": "NLP Service Running"}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "nlp-service"}


@app.post("/api/nlp/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: TextRequest):
    normalized_text = request.text.strip()
    doc = get_nlp()(normalized_text)
    focus_token = next((token for token in doc if token.is_alpha), doc[0] if len(doc) else None)

    if focus_token is None:
        return AnalyzeResponse(
            word=normalized_text,
            normalized_text=normalized_text,
            part_of_speech="unknown",
            lemma=normalized_text.lower(),
            ipa=ipa.convert(normalized_text).strip() or normalized_text,
            tokens=[],
            english_definition="",
            vietnamese_meanings=[],
            related_forms=[],
            synonyms=[],
            examples=[],
        )

    tokens = [
        TokenItem(
            text=token.text,
            lemma=token.lemma_,
            pos=normalize_pos(token.pos_),
        )
        for token in doc
        if not token.is_space
    ]

    lemma = focus_token.lemma_.strip() or normalized_text.lower()
    synsets = ranked_synsets(normalized_text, lemma, focus_token.pos_)
    english_definition = synsets[0].definition() if synsets else ""
    vietnamese_meanings = build_vietnamese_meanings(normalized_text, lemma, focus_token.pos_)
    related_forms = build_related_forms(normalized_text, lemma, focus_token.pos_)
    synonyms = build_synonyms(normalized_text, lemma, focus_token.pos_)
    examples = build_examples(normalized_text, lemma, focus_token.pos_)

    return AnalyzeResponse(
        word=normalized_text,
        normalized_text=normalized_text,
        part_of_speech=normalize_pos(focus_token.pos_),
        lemma=lemma,
        ipa=ipa.convert(normalized_text).strip() or normalized_text,
        tokens=tokens,
        english_definition=english_definition,
        vietnamese_meanings=vietnamese_meanings,
        related_forms=related_forms,
        synonyms=synonyms,
        examples=[ExampleItem(english_text=example) for example in examples],
    )
