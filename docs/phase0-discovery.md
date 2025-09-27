# Phase 0 Discovery Summary

## 1. Existing Assets Audit

### fine_tune_3b.py
- Fine-tunes `Qwen/Qwen2.5-Coder-3B-Instruct` with QLoRA (4-bit) for constrained VRAM setups.
- Downloads tokenizer and model from Hugging Face if `./models/Qwen2.5-Coder-3B-Instruct` is missing.
- Requires dataset generated in `./out_dataset/train.jsonl|valid.jsonl|test.jsonl` with `prompt` and `completion` fields.
- Uses `BitsAndBytesConfig`, `peft` LoRA adapters, and `Trainer` from `transformers`; saves artifacts in `./fine_tuned_3b`.
- GPU expectations: bfloat16 support, enough memory for batch size 2 with gradient accumulation 4.

### kilo_dataset_builder.py
- Clones a user-provided GitHub repository (shallow copy) and harvests files with web/code extensions (<300 KB).
- Converts each file to `{prompt, completion}` examples, optional MCP metadata, and saves 80/10/10 JSONL splits in `./out_dataset`.
- Depends on `git`, `requests`, `tqdm`, and filesystem access; no direct Hugging Face calls.

### Notebook pipeline (`fine_tune_kilo_dataset.ipynb` / `# %% [markdown].py`)
- Full end-to-end workflow: dataset loaders, optional tokenization, QLoRA fine-tuning for `Qwen2.5-Coder-7B-Instruct`.
- Integrates Hugging Face login (`huggingface_hub.login`), dataset pull from `bigcode/the-stack-smol`, repo cloning via loaders, and LoRA to GGUF export via `llama.cpp` tools.
- Defines configuration knobs (data source, epochs, max steps, languages, etc.) and requires a valid `HF_TOKEN`.

### `loaders/`
- `DatasetLoaderBase`: abstract helper that shuffles and writes JSONL splits (train/valid/test).
- `RepoUrlLoader`: clones GitHub repo, keeps supported extensions, optional MCP flag, respects `max_examples`.
- `StackSmolLoader`: streams `bigcode/the-stack-smol` (Hugging Face) with optional language filter before building examples.

### Environment helpers
- `setup_env.sh` / `.bat`: create venv and install `requirements.txt` (pip upgrade).
- `install_pytorch_gpu.bat`, `fix_pagefile.bat`: Windows scripts to provision GPU-ready PyTorch and system prerequisites.

## 2. Hugging Face Usage Overview
- Models: `Qwen/Qwen2.5-Coder-3B-Instruct`, `Qwen/Qwen2.5-Coder-7B-Instruct` pulled via `transformers`.
- Datasets: `bigcode/the-stack-smol` accessed with `datasets.load_dataset`.
- Auth: `huggingface_hub.login(token=...)` expected early in the notebook; requires persistent `HF_TOKEN`.
- Artifacts: LoRA outputs saved locally (`./kilo_code_qwen_lora`, `./merged_model`) before optional GGUF conversion.
- Model catalogue: cache daily list of eligible Hugging Face models for UI selection.
- Dataset search: allow users to query Hugging Face datasets and return matching entries.
## 3. Dependency Inventory

### Python packages (`requirements.txt`)
PyGithub, requests, tqdm, transformers, datasets, peft, accelerate, bitsandbytes, jupyter, torch (>=2.0), sentencepiece, safetensors, numpy, protobuf, huggingface_hub, pandas, scikit-learn.

### System/runtime prerequisites
- Python 3.10+ recommended for latest HF stack.
- GPU with CUDA and bfloat16/float16 support (QLoRA + bitsandbytes).
- `git` CLI for dataset builders.
- `llama.cpp` build (optional) for GGUF export.
- Stable internet for Hugging Face downloads; cache directory sizing for multi-GB models.

### External credentials and configs
- `HF_TOKEN` provided per user via profile settings; store securely server-side for Hugging Face calls.
- (Future) User-issued API tokens for the web interface (to be stored server-side).
- Optional GitHub PAT if cloning private repositories via `RepoUrlLoader`.

## 4. Web Interface Goal Candidates
- Launch fine-tuning or dataset build jobs from the UI in <30 s from form submission to queued task acknowledgement.
- Report live job status with refresh latency <=5 s, including progress, current step, and latest log lines.
- Allow users to register datasets/models sourced from Hugging Face by ID and persist metadata in SQLite.
- Provide one-click download/share for generated adapters (LoRA or GGUF) once a run completes.

## 5. Design Direction Baseline
- Neon dark theme with violet-to-magenta gradients and soft glows on primary panels.
- Bold sans-serif typography for hero titles; lighter gray body copy for descriptions.
- Glassmorphism cards for dashboard widgets, with rounded corners and subtle inner shadows.
- CTA buttons styled as pill capsules with pink/violet highlights and hover glow.
- Background grid/nebula pattern to reinforce futurist aesthetic (per provided inspiration).

## 6. Follow-up Items
- Confirm minimum GPU memory targets for production (documented requirement for 3B vs 7B flows).
- Validate Hugging Face token encryption/rotation implementation during Phase 1 scaffolding.
- Catalogue which notebook steps must become reusable Python modules for the upcoming API runner.
- Gather any additional datasets/models the client expects beyond Qwen2.5 variants.
- Define daily Hugging Face model refresh job and rate-limited dataset search flow for the UI.





