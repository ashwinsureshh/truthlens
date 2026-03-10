"""
TruthLens — RoBERTa Fine-tuning on LIAR Dataset
Week 2 script.

Usage:
  1. Download LIAR dataset: https://www.cs.ucsb.edu/~william/data/liar_dataset.zip
  2. Extract to data/liar/
  3. Run: python train.py

Saves checkpoint to: checkpoints/roberta-truthlens/
"""

import os
import pandas as pd
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)
from torch.utils.data import Dataset
from sklearn.metrics import accuracy_score, f1_score
import numpy as np

MODEL_NAME = "roberta-base"
DATA_DIR = "data/liar"
OUTPUT_DIR = "checkpoints/roberta-truthlens"
NUM_LABELS = 6
MAX_LENGTH = 256

LABEL_MAP = {
    "pants-fire": 0,
    "false": 1,
    "barely-true": 2,
    "half-true": 3,
    "mostly-true": 4,
    "true": 5,
}


class LiarDataset(Dataset):
    def __init__(self, path: str, tokenizer):
        # LIAR .tsv has no header; column 1 = label, column 2 = statement
        df = pd.read_csv(path, sep="\t", header=None, usecols=[1, 2], names=["label", "text"])
        df = df[df["label"].isin(LABEL_MAP)]
        self.labels = df["label"].map(LABEL_MAP).tolist()
        encodings = tokenizer(
            df["text"].tolist(),
            truncation=True,
            padding=True,
            max_length=MAX_LENGTH,
        )
        self.input_ids = encodings["input_ids"]
        self.attention_mask = encodings["attention_mask"]

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return {
            "input_ids": torch.tensor(self.input_ids[idx]),
            "attention_mask": torch.tensor(self.attention_mask[idx]),
            "labels": torch.tensor(self.labels[idx]),
        }


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {
        "accuracy": accuracy_score(labels, preds),
        "f1": f1_score(labels, preds, average="weighted"),
    }


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=NUM_LABELS)

    train_dataset = LiarDataset(os.path.join(DATA_DIR, "train.tsv"), tokenizer)
    val_dataset = LiarDataset(os.path.join(DATA_DIR, "valid.tsv"), tokenizer)
    test_dataset = LiarDataset(os.path.join(DATA_DIR, "test.tsv"), tokenizer)

    args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=5,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=32,
        learning_rate=2e-5,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        logging_steps=50,
        fp16=torch.cuda.is_available(),
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
    )

    trainer.train()

    # Evaluate on test set
    results = trainer.evaluate(test_dataset)
    print(f"\nTest set results: {results}")

    # Save final model
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print(f"\nModel saved to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
