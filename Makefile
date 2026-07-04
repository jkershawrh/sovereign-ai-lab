.PHONY: up-infra down-infra preflight-infra attest pipeline verify-infra reset-infra seed \
       up-gateway down-gateway preflight-gateway verify-gateway scenarios \
       deploy-dev-cluster-1

# ─── Infrastructure (Doc 1) ──────────────────────────────────────────────────

up-infra:
	@echo "Starting core infrastructure..."
	git submodule update --init --recursive
	podman-compose -f docker-compose.infra.yml up -d
	@sleep 15
	@bash scripts/preflight-infra.sh

down-infra:
	podman-compose -f docker-compose.infra.yml down -v

preflight-infra:
	@bash scripts/preflight-infra.sh

attest:
	@bash infra/tdx/attest.sh

proof-writers:
	@bash scripts/write-platform-proof.sh
	@bash scripts/write-data-governance.sh
	@bash scripts/write-agent-registration.sh

pipeline:
	@bash scripts/run-pipeline.sh

verify-infra:
	@python3 scripts/verify-infra.py

reset-infra:
	@bash scripts/reset-infra.sh

seed:
	@bash scripts/seed-model.sh

# ─── Gateway (Doc 2) ─────────────────────────────────────────────────────────

up-gateway: up-infra
	@echo "Starting gateway services..."
	podman-compose -f docker-compose.infra.yml \
	               -f docker-compose.gateway.yml up -d
	@sleep 10
	@bash scripts/preflight-gateway.sh

down-gateway:
	podman-compose -f docker-compose.infra.yml \
	               -f docker-compose.gateway.yml down

preflight-gateway:
	@bash scripts/preflight-gateway.sh

verify-gateway:
	@python3 scripts/verify-gateway.py

scenarios:
	@echo "Running all five demo scenarios..."
	python3 experience/demo/scenarios/01-attestation.py
	python3 experience/demo/scenarios/02-provenance.py
	python3 experience/demo/scenarios/03-routing.py
	python3 experience/demo/scenarios/04-policy.py
	python3 experience/demo/scenarios/05-verify.py
	@echo "All scenarios passed."

# ─── dev-cluster-1 (DEV) ───────────────────────────────────────────────────────────

deploy-dev-cluster-1:
	@bash infrastructure/dev-cluster-1/deploy.sh
