"""
TruthLens — HuggingFace RoBERTa Inference Pipeline
Week 1: Verify the base model loads and can classify sentences.
Week 2: Fine-tune on LIAR dataset and replace MODEL_NAME with checkpoint path.
"""

import sys
import re
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification

# Week 1: use base model for sanity check
# Week 2: replace with "checkpoints/roberta-truthlens" after fine-tuning
MODEL_NAME = "roberta-base"

LIAR_LABELS = [
    "pants-fire",   # 0 — completely false
    "false",        # 1
    "barely-true",  # 2
    "half-true",    # 3
    "mostly-true",  # 4
    "true",         # 5
]


def load_model(model_path: str = MODEL_NAME):
    """Load tokenizer and model. Call once at app startup."""
    print(f"Loading model from: {model_path}")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    classifier = pipeline("text-classification", model=model, tokenizer=tokenizer, top_k=1)
    print("Model loaded successfully.")
    return classifier


def score_sentence(classifier, sentence: str) -> dict:
    """
    Returns a credibility score (0–100, higher = more suspicious)
    and the raw label from the model.
    """
    result = classifier(sentence[:512], truncation=True)[0][0]
    label = result["label"]  # e.g. "LABEL_0" from base model, or LIAR label after fine-tuning
    confidence = result["score"]

    # Map LIAR 6-class labels → suspicion score 0–100
    # pants-fire (idx 0) → ~100, true (idx 5) → ~0
    try:
        label_idx = int(label.split("_")[-1])  # works for "LABEL_0" and "LIAR_0"
        suspicion = round((1 - label_idx / 5) * 100, 1)
    except (ValueError, IndexError):
        suspicion = 50.0  # fallback

    return {
        "sentence": sentence,
        "label": label,
        "confidence": round(confidence, 3),
        "suspicion_score": suspicion,
    }


def analyze_article(classifier, text: str) -> dict:
    """Split article into sentences and score each one."""
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.split()) >= 4]

    results = [score_sentence(classifier, s) for s in sentences]
    scores = [r["suspicion_score"] for r in results]
    overall = round(sum(scores) / len(scores), 1) if scores else 50.0

    return {
        "overall_score": overall,
        "sentence_count": len(sentences),
        "results": results,
    }


if __name__ == "__main__":
    # Quick sanity test — run with: python inference.py
    sample = (
        "Scientists have confirmed that vaccines cause autism in 99% of children. "
        "The study was conducted by a team at MIT and published in Nature. "
        "Health officials say there is no cause for concern."
    )

    classifier = load_model()
    output = analyze_article(classifier, sample)

    print(f"\nOverall suspicion score: {output['overall_score']}/100")
    print(f"Sentences analyzed: {output['sentence_count']}\n")
    for r in output["results"]:
        print(f"  [{r['suspicion_score']:5.1f}] {r['sentence'][:80]}...")
