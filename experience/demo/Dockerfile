ARG PYTHON_IMAGE=docker.io/library/python@sha256:174bec68e0451bffabbb08c7d5d21c6b253f772d81d52b9558af97bb3159b761
FROM ${PYTHON_IMAGE}
ARG SOURCE_REVISION
LABEL org.opencontainers.image.title="Sovereign AI demo API" \
      org.opencontainers.image.revision="${SOURCE_REVISION}"
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .

USER 1001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9099"]
