#!/bin/bash
# ==================================================
# 🚀 Setup Script for Kilo Code Fine-tuning Package (Linux/Mac)
# ==================================================

echo "[1/4] Creating virtual environment in .env ..."
python3 -m venv .env

echo "[2/4] Activating environment ..."
source .env/bin/activate

echo "[3/4] Installing dependencies ..."
pip install --upgrade pip
pip install -r requirements.txt

echo "[4/4] Setup complete!"
echo
echo "============================================="
echo "✅ Environment ready."
echo "To activate later, run:"
echo "   source .env/bin/activate"
echo "Then you can run:"
echo "   python kilo_dataset_builder.py --help"
echo "or open Jupyter:"
echo "   jupyter notebook fine_tune_kilo_dataset.ipynb"
echo "============================================="
