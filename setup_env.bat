@echo off
REM ==================================================
REM 🚀 Setup Script for Kilo Code Fine-tuning Package (Windows)
REM ==================================================

echo [1/7] Creating virtual environment in .env ...
python -m venv .env

echo [2/7] Activating environment ...
call .env\Scripts\activate

echo [3/7] Installing dependencies ...
pip install --upgrade pip
pip install -r requirements.txt

echo [4/7] Checking if llama.cpp is already cloned ...
if not exist "llama.cpp" (
    echo [5/7] Cloning llama.cpp repository ...
    git clone https://github.com/ggerganov/llama.cpp.git
) else (
    echo [5/7] llama.cpp already exists, skipping clone ...
)

echo [6/7] Building llama.cpp ...
if not exist "llama.cpp\build" (
    mkdir llama.cpp\build
)
cd llama.cpp\build
cmake .. -DLLAMA_CURL=OFF
cmake --build . --config Release
cd ..\..

echo [7/7] Setup complete!
echo.
echo =============================================
echo ✅ Environment ready.
echo To activate later, run:
echo    call .env\Scripts\activate
echo Then you can run:
echo    python kilo_dataset_builder.py --help
echo or open Jupyter:
echo    jupyter notebook fine_tune_kilo_dataset.ipynb
echo =============================================
pause
