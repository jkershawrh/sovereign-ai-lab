FROM python:3.11-slim
WORKDIR /app
COPY are-immutable-ledger/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Preserve directory structure gateway.py expects:
# gateway.py does sys.path.insert(.., "sdks", "python")
COPY are-immutable-ledger/api/gateway.py ./api/
COPY are-immutable-ledger/sdks/python/ ./sdks/python/

WORKDIR /app/api
CMD ["python", "gateway.py"]
