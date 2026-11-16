FROM mcr.microsoft.com/playwright:v1.63.0-noble
WORKDIR /workspace
RUN npm install --no-save playwright@1.63.0 @msgpack/msgpack
RUN apt-get update \
  && apt-get install -y --no-install-recommends libnss3-tools \
  && rm -rf /var/lib/apt/lists/*
COPY packages/protocol/dist /workspace/packages/protocol/dist
COPY tests/webtransport/container-runner.mjs /workspace/tests/webtransport/container-runner.mjs
COPY infra/webtransport/certs/generated/rootCA.pem /usr/local/share/ca-certificates/webtransport-dev.crt
RUN update-ca-certificates
RUN mkdir -p /root/.pki/nssdb \
  && certutil -N -d sql:/root/.pki/nssdb --empty-password \
  && certutil -A -d sql:/root/.pki/nssdb -n rocksoul-webtransport-root \
    -t "C,," -i /usr/local/share/ca-certificates/webtransport-dev.crt
CMD ["node", "tests/webtransport/container-runner.mjs"]
