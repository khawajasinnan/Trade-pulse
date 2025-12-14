#!/usr/bin/env bash
set -euo pipefail

# Setup Python venv and install required modules for ML service
# Usage: ./setup-venv.sh [venv_path]

VENV_PATH=${1:-.venv}
REQ_FILE="requirements.txt"

if [ ! -f "$REQ_FILE" ]; then
  echo "requirements.txt not found in $(pwd)."
  exit 1
fi

python3 -m venv "$VENV_PATH"
source "$VENV_PATH/bin/activate"
python -m pip install --upgrade pip
pip install -r "$REQ_FILE"

cat <<'EOF'

✅ Virtualenv set up successfully.
To activate, run:

  source $VENV_PATH/bin/activate

To run the script:

  python ml_prediction.py "DATABASE_URL" "EUR-USD"

If you use VS Code, select the created Python interpreter in the bottom-right corner so Pylance detects installed packages.

EOF
