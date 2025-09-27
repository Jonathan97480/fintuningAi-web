#!/usr/bin/env python3
"""
Script alternatif pour fine-tuner Qwen2.5-Coder avec un modèle plus petit
Utilisez ce script si le notebook principal ne fonctionne pas à cause de limitations mémoire
"""

import os
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import load_dataset
from pathlib import Path

def main():
    print("🚀 Fine-tuning Qwen2.5-Coder-3B (version légère)")

    # Configuration pour modèle plus petit
    MODEL_NAME = "Qwen/Qwen2.5-Coder-3B-Instruct"
    LOCAL_MODEL_DIR = "./models/Qwen2.5-Coder-3B-Instruct"

    # Configuration QLoRA optimisée pour petits modèles
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
    )

    # Téléchargement du modèle si nécessaire
    if not os.path.exists(LOCAL_MODEL_DIR):
        print("🌐 Téléchargement du modèle 3B...")
        os.makedirs("./models", exist_ok=True)

        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
        tokenizer.save_pretrained(LOCAL_MODEL_DIR)

        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )
        model.save_pretrained(LOCAL_MODEL_DIR)
        print("✅ Modèle 3B téléchargé")
    else:
        print("📂 Modèle 3B trouvé en local")

    # Chargement du modèle
    print("🔄 Chargement du modèle 3B...")
    tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL_DIR, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        LOCAL_MODEL_DIR,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )

    # Configuration LoRA
    lora_config = LoraConfig(
        r=8,
        lora_alpha=16,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )

    model = prepare_model_for_kbit_training(model)
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # Chargement du dataset (utilise le même que le notebook)
    dataset_path = Path("./out_dataset")
    if not dataset_path.exists():
        print("❌ Dataset non trouvé. Exécutez d'abord le notebook pour générer le dataset.")
        return

    dataset = load_dataset("json", data_files={
        "train": str(dataset_path / "train.jsonl"),
        "validation": str(dataset_path / "valid.jsonl"),
        "test": str(dataset_path / "test.jsonl")
    })

    # Tokenization
    def tokenize_function(examples):
        texts = [p + "\n" + c for p, c in zip(examples["prompt"], examples["completion"])]
        return tokenizer(texts, max_length=512, truncation=True, padding=True)

    tokenized_dataset = dataset.map(tokenize_function, batched=True, remove_columns=dataset["train"].column_names)

    # Entraînement
    training_args = TrainingArguments(
        output_dir="./results_3b",
        per_device_train_batch_size=2,  # Plus grand batch size possible avec 3B
        gradient_accumulation_steps=4,
        max_steps=500,  # Limité pour test rapide
        learning_rate=2e-4,
        fp16=True,
        logging_steps=10,
        save_steps=100,
        save_total_limit=2,
        evaluation_strategy="steps",
        eval_steps=100,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset["train"],
        eval_dataset=tokenized_dataset["validation"],
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
    )

    print("🏃 Démarrage de l'entraînement...")
    trainer.train()

    # Sauvegarde
    model.save_pretrained("./fine_tuned_3b")
    tokenizer.save_pretrained("./fine_tuned_3b")
    print("✅ Modèle fine-tuné sauvegardé dans ./fine_tuned_3b")

if __name__ == "__main__":
    main()