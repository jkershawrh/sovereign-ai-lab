ARG PYTHON_IMAGE=docker.io/library/python@sha256:7bf6c3111fe094f8ee1a1cbcdc63c4cfb345b0e3df42d5aa9a90b3b4b022ab6d
FROM ${PYTHON_IMAGE}
ARG SOURCE_REVISION
LABEL org.opencontainers.image.title="Sovereign AI demo API" \
      org.opencontainers.image.revision="${SOURCE_REVISION}"
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip uninstall -y pip setuptools wheel jaraco.context || true \
    && rm -rf /root/.cache /usr/local/lib/python3.14/site-packages/pip* \
       /usr/local/lib/python3.14/site-packages/setuptools* \
       /usr/local/lib/python3.14/site-packages/wheel* \
       /usr/local/lib/python3.14/site-packages/jaraco/context*
COPY main.py .

USER 1001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9099"]
