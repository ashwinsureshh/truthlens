"""
TruthLens — RoBERTa Fine-tuning Script
=======================================
Trains a binary credibility classifier (credible vs suspicious)
using multiple HuggingFace datasets.

Datasets used:
  - liar          : 12K political fact-check statements (6-class → binary)
  - GonzaloA/fake_news : 72K news articles (real/fake)

Usage (Windows PC with RTX 5070):
  cd model/
  pip install -r requirements-train.txt
  python train.py

Expected training time:
  - RTX 5070  : ~15-25 minutes
  - CPU only  : ~4-6 hours

Saves checkpoint to: checkpoints/roberta-truthlens/
"""

import os
import numpy as np
import torch
from datasets import load_dataset, Dataset, concatenate_datasets
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback,
    DataCollatorWithPadding,
)
from sklearn.metrics import accuracy_score, f1_score, classification_report

# ── Config ────────────────────────────────────────────────────────────────────
MODEL_NAME  = "roberta-base"
OUTPUT_DIR  = "checkpoints/roberta-truthlens"
MAX_LENGTH  = 128
NUM_LABELS  = 2
EPOCHS      = 4
SEED        = 42

# ── Device detection ─────────────────────────────────────────────────────────
def get_device():
    if torch.cuda.is_available():
        name = torch.cuda.get_device_name(0)
        vram = torch.cuda.get_device_properties(0).total_memory / 1e9
        print(f"✅ CUDA GPU: {name} ({vram:.1f} GB VRAM)")
        return "cuda"
    if torch.backends.mps.is_available():
        print("✅ Apple MPS (Metal)")
        return "mps"
    print("⚠️  No GPU found — using CPU (will be slow)")
    return "cpu"


# ── Dataset loaders ───────────────────────────────────────────────────────────

def load_liar():
    """LIAR dataset: 12K political statements, 6 classes → binary."""
    print("  Loading LIAR dataset...")
    ds = load_dataset("liar", trust_remote_code=True)

    # 6-class label mapping
    # pants-fire=0, false=1, barely-true=2 → suspicious (1)
    # half-true=3, mostly-true=4, true=5   → credible (0)
    label_map = {0: 1, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0}

    def process(example):
        return {
            "text":   example["statement"],
            "labels": label_map[example["label"]],
        }

    keep_cols = ["text", "labels"]
    result = {}
    for split in ["train", "validation", "test"]:
        processed = ds[split].map(process, remove_columns=ds[split].column_names)
        result[split] = processed
    print(f"  LIAR: {len(result['train'])} train / {len(result['validation'])} val / {len(result['test'])} test")
    return result


def load_fakenews():
    """GonzaloA/fake_news: 72K news articles, real(0)/fake(1)."""
    print("  Loading fake_news dataset...")
    try:
        ds = load_dataset("GonzaloA/fake_news", trust_remote_code=True)

        def process(example):
            text = (example.get("title") or "") + " " + (example.get("text") or "")
            return {
                "text":   text.strip()[:512],   # truncate very long articles
                "labels": int(example["label"]),  # 0=real, 1=fake
            }

        keep_cols = ["text", "labels"]
        result = {}
        for split in ["train", "validation", "test"]:
            if split in ds:
                processed = ds[split].map(process, remove_columns=ds[split].column_names)
                # Filter out empty texts
                processed = processed.filter(lambda x: len(x["text"]) > 20)
                result[split] = processed
        print(f"  fake_news: {len(result['train'])} train / {len(result.get('validation', []))} val")
        return result
    except Exception as e:
        print(f"  ⚠️  fake_news dataset unavailable ({e}) — using LIAR only")
        return None


def build_dataset():
    """Combine LIAR + fake_news into a single DatasetDict."""
    liar    = load_liar()
    fakenews = load_fakenews()

    if fakenews:
        train = concatenate_datasets([liar["train"], fakenews["train"]]).shuffle(seed=SEED)
        val   = concatenate_datasets([
            liar["validation"],
            fakenews.get("validation", liar["validation"].select(range(0)))
        ]).shuffle(seed=SEED)
        test  = liar["test"]   # keep LIAR test for clean eval
    else:
        train = liar["train"].shuffle(seed=SEED)
        val   = liar["validation"]
        test  = liar["test"]

    print(f"\n📊 Final dataset: {len(train)} train / {len(val)} val / {len(test)} test")

    # Label balance
    labels = train["labels"]
    n_cred = labels.count(0)
    n_susp = labels.count(1)
    print(f"   Credible: {n_cred} ({100*n_cred/len(labels):.1f}%) | Suspicious: {n_susp} ({100*n_susp/len(labels):.1f}%)")

    return train, val, test


# ── Metrics ───────────────────────────────────────────────────────────────────
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {
        "accuracy": round(accuracy_score(labels, preds), 4),
        "f1":       round(f1_score(labels, preds, average="binary"), 4),
        "f1_macro": round(f1_score(labels, preds, average="macro"), 4),
    }


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  TruthLens — RoBERTa Fine-tuning")
    print("=" * 60)

    device = get_device()
    use_cuda = device == "cuda"
    use_mps  = device == "mps"

    # Batch size: larger on GPU
    batch_size = 32 if use_cuda else 16

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # ── Dataset ──────────────────────────────────────────────────────────────
    print("\n📥 Loading datasets...")
    train_ds, val_ds, test_ds = build_dataset()

    # ── Tokenizer ─────────────────────────────────────────────────────────────
    print(f"\n🔤 Loading tokenizer: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    def tokenize(batch):
        return tokenizer(
            batch["text"],
            truncation=True,
            max_length=MAX_LENGTH,
        )

    print("   Tokenizing...")
    train_tok = train_ds.map(tokenize, batched=True, remove_columns=["text"])
    val_tok   = val_ds.map(tokenize,   batched=True, remove_columns=["text"])
    test_tok  = test_ds.map(tokenize,  batched=True, remove_columns=["text"])

    train_tok.set_format("torch")
    val_tok.set_format("torch")
    test_tok.set_format("torch")

    # ── Model ─────────────────────────────────────────────────────────────────
    print(f"\n🤖 Loading model: {MODEL_NAME}")
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_LABELS,
        id2label={0: "credible", 1: "suspicious"},
        label2id={"credible": 0, "suspicious": 1},
    )

    total_params = sum(p.numel() for p in model.parameters()) / 1e6
    print(f"   Parameters: {total_params:.1f}M")

    # ── Training args ─────────────────────────────────────────────────────────
    args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size * 2,
        learning_rate=2e-5,
        weight_decay=0.01,
        warmup_ratio=0.06,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        greater_is_better=True,
        logging_steps=100,
        fp16=use_cuda,          # fp16 on CUDA (RTX 5070) = 2x faster
        bf16=False,
        dataloader_num_workers=0,   # 0 = safer on Windows
        report_to="none",
        save_total_limit=2,
        seed=SEED,
    )

    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_tok,
        eval_dataset=val_tok,
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    # ── Train ─────────────────────────────────────────────────────────────────
    print(f"\n🚀 Starting training — {EPOCHS} epochs, batch size {batch_size}")
    print(f"   fp16={'ON' if use_cuda else 'OFF'} | device={device.upper()}\n")

    trainer.train()

    # ── Evaluate ──────────────────────────────────────────────────────────────
    print("\n📈 Evaluating on test set...")
    results = trainer.evaluate(test_tok)
    print(f"\n   Test accuracy : {results.get('eval_accuracy', 'N/A')}")
    print(f"   Test F1       : {results.get('eval_f1', 'N/A')}")
    print(f"   Test F1 macro : {results.get('eval_f1_macro', 'N/A')}")

    # Detailed classification report
    preds_out  = trainer.predict(test_tok)
    preds      = np.argmax(preds_out.predictions, axis=-1)
    labels     = preds_out.label_ids
    print("\n" + classification_report(labels, preds, target_names=["credible", "suspicious"]))

    # ── Save ──────────────────────────────────────────────────────────────────
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print(f"\n✅ Model saved to: {OUTPUT_DIR}")
    print("   Copy this folder to the backend's model/checkpoints/ and restart.")


if __name__ == "__main__":
    main()
