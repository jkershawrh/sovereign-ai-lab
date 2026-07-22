FROM python:3.11-slim

WORKDIR /app

# Install adapter dependencies
COPY prompt-adapter/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install GCL from the submodule
COPY governed-cognitive-loop /app/gcl-src
RUN pip install --no-cache-dir /app/gcl-src

# Copy adapter code + rules
COPY prompt-adapter/adapter.py /app/adapter.py
COPY prompt-adapter/rules.yaml /app/rules.yaml

EXPOSE 8001

USER 1001
CMD ["uvicorn", "adapter:app", "--host", "0.0.0.0", "--port", "8001"]
