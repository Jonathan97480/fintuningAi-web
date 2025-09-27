@echo off
REM ==================================================
REM 🚀 Install PyTorch with CUDA (Windows - RTX 3060)
REM ==================================================

echo [1/3] Activating environment ...
call .env\Scripts\activate

echo [2/3] Upgrading pip ...
python -m pip install --upgrade pip

echo [3/3] Installing PyTorch (CUDA 12.1) ...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

echo =============================================
echo ✅ PyTorch with CUDA installed successfully.
echo Test it with:
echo    python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
echo =============================================
pause
