import os
import tempfile

# Ensure importing app.main in test collection never attempts to mkdir("/data") on read-only hosts.
os.environ.setdefault("DATA_DIR", tempfile.mkdtemp(prefix="mw-memory-pytest-"))
