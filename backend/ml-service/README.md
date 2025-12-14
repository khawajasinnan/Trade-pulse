## ML service: Setup & Troubleshooting

This folder includes the LSTM-based prediction script that is used by the backend to generate ML predictions.

How to set up the Python environment (recommended):

1. Create and activate a Python virtual environment (Linux / macOS):

```bash
cd backend/ml-service
./setup-venv.sh .venv
source .venv/bin/activate
```

2. Run the script:

```bash
# Option A: Pass a full database URL directly
python ml_prediction.py "postgresql://user:pass@host:port/dbname" "EUR-USD"

# Option B: Use the environment variable DATABASE_URL (use literal 'DATABASE_URL' as placeholder)
export DATABASE_URL="postgresql://user:pass@host:port/dbname"
python ml_prediction.py DATABASE_URL "EUR-USD"
```

Notes:
- The script uses `tensorflow`, `numpy`, `pandas`, `scikit-learn`, and `psycopg2-binary`.
- If you see VS Code / Pylance import warnings like `Import "numpy" could not be resolved`, switch the interpreter to the virtualenv created above (in the status bar) and restart the editor.
- TensorFlow requires a modern Python interpreter (3.8+), and GPUs may require additional configuration.

Tip: By default the backend looks for a venv at `ml-service/venv` or `ml-service/.venv`.
If your environment uses a different Python binary, set the `ML_PYTHON_CMD` environment variable (absolute path) so the backend can find it, for example:

```bash
export ML_PYTHON_CMD=/full/path/to/ml-service/.venv/bin/python3
```

Troubleshooting:
- If `pip install tensorflow` fails due to a compiler or dependency error, use a wheel or install a CPU-only version appropriate for your platform.
- For Neon/Postgres connectivity, make sure `DATABASE_URL` is set and accessible and that `psycopg2-binary` is installed.

If you want, I can add a `docker-compose` or devcontainer configuration so the environment is reproducible for the team.

