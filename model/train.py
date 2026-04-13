"""
TruthLens — RoBERTa Fine-tuning on LIAR Dataset
Auto-downloads the dataset from HuggingFace; no manual download needed.

Usage:
  cd model/
  python train.py

Saves checkpoint to: checkpoints/roberta-truthlens/
Estimated time: ~30-60 min on Apple Silicon (MPS), ~2-4 hrs on CPU.
"""

import os
import io
import zipfile
import numpy as np
import torch
import requests
import pandas as pd
from datasets import Dataset, DatasetDict
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback,
)
from sklearn.metrics import accuracy_score, f1_score

# ── Dataset loader ────────────────────────────────────────────────────────────

LIAR_URL = "https://www.cs.ucsb.edu/~william/data/liar_dataset.zip"
LIAR_COLS = [0, 1, 2]   # id, label, statement
LIAR_NAMES = ["id", "label", "statement"]

LABEL_STR_MAP = {
    "pants-fire": 0, "false": 1, "barely-true": 2,
    "half-true": 3, "mostly-true": 4, "true": 5,
}


def _load_liar_dataset() -> DatasetDict:
    """Download the LIAR zip and return a HuggingFace DatasetDict."""
    data_dir = os.path.join(os.path.dirname(__file__), "data", "liar")
    splits = {"train": "train.tsv", "validation": "valid.tsv", "test": "test.tsv"}

    # Download if not already cached
    if not all(os.path.exists(os.path.join(data_dir, f)) for f in splits.values()):
        print(f"  Downloading from {LIAR_URL}...")
        os.makedirs(data_dir, exist_ok=True)
        resp = requests.get(LIAR_URL, timeout=60)
        resp.raise_for_status()
        with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
            z.extractall(data_dir)
        print("  Download complete.")
    else:
        print("  Using cached LIAR files.")

    def _read_split(filename):
        df = pd.read_csv(
            os.path.join(data_dir, filename),
            sep="\t", header=None,
            usecols=LIAR_COLS, names=LIAR_NAMES,
        )
        df = df[df["label"].isin(LABEL_STR_MAP)]
        df["label"] = df["label"].map(LABEL_STR_MAP)
        # Use "labels" (plural) — required by HuggingFace Trainer for loss computation
        return Dataset.from_dict({"statement": df["statement"].tolist(), "labels": df["label"].tolist()})

    return DatasetDict({
        "train":      _read_split("train.tsv"),
        "validation": _read_split("valid.tsv"),
        "test":       _read_split("test.tsv"),
    })


# ── Config ────────────────────────────────────────────────────────────────────
MODEL_NAME  = "roberta-base"
OUTPUT_DIR  = "checkpoints/roberta-truthlens"
MAX_LENGTH  = 128   # LIAR statements are short; 128 is enough
NUM_LABELS  = 2     # binary: credible (0) vs suspicious (1)
EPOCHS      = 4
BATCH_SIZE  = 16

# LIAR 6-class → binary mapping
# pants-fire(0), false(1), barely-true(2) → suspicious (1)
# half-true(3), mostly-true(4), true(5)   → credible (0)
def liar_to_binary(example):
    example["labels"] = 1 if example["labels"] in [0, 1, 2] else 0
    return example

# ── Metrics ───────────────────────────────────────────────────────────────────
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {
        "accuracy": round(accuracy_score(labels, preds), 4),
        "f1":       round(f1_score(labels, preds, average="binary"), 4),
    }

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Detect best available device
    if torch.backends.mps.is_available():
        device = "mps"
        print("Using Apple MPS (Metal) for training.")
    elif torch.cuda.is_available():
        device = "cuda"
        print("Using CUDA GPU for training.")
    else:
        device = "cpu"
        print("Using CPU for training (this will be slow).")

    # ── Dataset ──────────────────────────────────────────────────────────────
    print("\nDownloading LIAR dataset...")
    raw = _load_liar_dataset()

    # Map 6-class labels to binary
    dataset = raw.map(liar_to_binary)

    # ── Tokenizer ─────────────────────────────────────────────────────────────
    print(f"Loading tokenizer: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    def tokenize(batch):
        enc = tokenizer(
            batch["statement"],
            truncation=True,
            padding="max_length",
            max_length=MAX_LENGTH,
        )
        enc["labels"] = batch["labels"]
        return enc

    tokenized = dataset.map(tokenize, batched=True, remove_columns=["statement"])
    tokenized.set_format("torch")

    # ── Model ─────────────────────────────────────────────────────────────────
    print(f"Loading model: {MODEL_NAME}")
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_LABELS,
        id2label={0: "credible", 1: "suspicious"},
        label2id={"credible": 0, "suspicious": 1},
    )

    # ── Training args ─────────────────────────────────────────────────────────
    use_mps = device == "mps"
    args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE * 2,
        learning_rate=2e-5,
        weight_decay=0.01,
        warmup_ratio=0.1,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        greater_is_better=True,
        logging_steps=50,
        fp16=False,           # MPS doesn't support fp16
        use_mps_device=use_mps,
        report_to="none",     # disable wandb/tensorboard
        save_total_limit=2,
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=tokenized["train"],
        eval_dataset=tokenized["validation"],
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    # ── Train ─────────────────────────────────────────────────────────────────
    print(f"\nStarting training for {EPOCHS} epochs...\n")
    trainer.train()

    # ── Evaluate on test set ──────────────────────────────────────────────────
    print("\nEvaluating on test set...")
    results = trainer.evaluate(tokenized["test"])
    print(f"Test results: accuracy={results.get('eval_accuracy')}, f1={results.get('eval_f1')}")

    # ── Save ──────────────────────────────────────────────────────────────────
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print(f"\nModel saved to: {OUTPUT_DIR}")
    print("Update MODEL_PATH in .env to point to this checkpoint.")


if __name__ == "__main__":
    main()
