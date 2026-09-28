ARG PYTHON_IMAGE=docker.io/library/python@sha256:7bf6c3111fe094f8ee1a1cbcdc63c4cfb345b0e3df42d5aa9a90b3b4b022ab6d
FROM ${PYTHON_IMAGE}
ARG SOURCE_REVISION
LABEL org.opencontainers.image.title="Sovereign AI prompt adapter" \
      org.opencontainers.image.revision="${SOURCE_REVISION}"
WORKDIR /app
RUN pip uninstall -y pip setuptools wheel jaraco.context || true \
    && rm -rf /root/.cache /usr/local/lib/python3.14/site-packages/pip* \
       /usr/local/lib/python3.14/site-packages/setuptools* \
       /usr/local/lib/python3.14/site-packages/wheel* \
       /usr/local/lib/python3.14/site-packages/jaraco/context*
COPY router.py .
EXPOSE 8001

USER 1001
CMD ["python3", "router.py"]
