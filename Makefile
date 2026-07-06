.PHONY: up down verify up-infra down-infra preflight-infra attest pipeline verify-infra reset-infra seed \
       up-gateway down-gateway preflight-gateway verify-gateway verify-experience scenarios \
       deploy-dev-cluster-1

# ─── Infrastructure (Doc 1) ──────────────────────────────────────────────────

up: up-infra

verify: verify-infra verify-gateway verify-experience

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
	@if [ ! -f docker-compose.gateway.yml ]; then \
		echo "docker-compose.gateway.yml is not present yet. Use make deploy-dev-cluster-1 for the full demo stack, or add the gateway compose file before running up-gateway."; \
		exit 1; \
	fi
	@echo "Starting gateway services..."
	podman-compose -f docker-compose.infra.yml -f docker-compose.gateway.yml up -d
	@sleep 10
	@bash scripts/preflight-gateway.sh

down-gateway:
	@if [ ! -f docker-compose.gateway.yml ]; then \
		echo "docker-compose.gateway.yml is not present; nothing to stop for the local gateway overlay."; \
		exit 0; \
	fi
	podman-compose -f docker-compose.infra.yml -f docker-compose.gateway.yml down

preflight-gateway:
	@bash scripts/preflight-gateway.sh

verify-gateway:
	@python3 scripts/verify-gateway.py

verify-experience:
	@python3 scripts/verify-experience.py

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

smoke-test:
	@python3 scripts/smoke-test.py
