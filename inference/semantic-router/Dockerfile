ARG PYTHON_IMAGE=docker.io/library/python@sha256:174bec68e0451bffabbb08c7d5d21c6b253f772d81d52b9558af97bb3159b761
FROM ${PYTHON_IMAGE}
ARG SOURCE_REVISION
LABEL org.opencontainers.image.title="Sovereign AI prompt adapter" \
      org.opencontainers.image.revision="${SOURCE_REVISION}"
WORKDIR /app
COPY router.py .
EXPOSE 8001

USER 1001
CMD ["python3", "router.py"]
