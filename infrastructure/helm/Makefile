SHELL := /bin/bash
SCRIPT_DIR := $(dir $(lastword $(MAKEFILE_LIST)))/../dev-cluster-1
NAMESPACE ?= sovereign-ai-lab
SOVEREIGN_MODE ?= full
MAAS_ENDPOINT ?= https://litellm.example.com/v1/chat/completions
MAAS_MODEL ?= granite-3-2-8b-instruct
LITELLM_API_KEY ?=

.PHONY: install uninstall

install:
	NS=$(NAMESPACE) \
	SOVEREIGN_MODE=$(SOVEREIGN_MODE) \
	MAAS_ENDPOINT=$(MAAS_ENDPOINT) \
	MAAS_MODEL=$(MAAS_MODEL) \
	LITELLM_API_KEY=$(LITELLM_API_KEY) \
	bash $(SCRIPT_DIR)/deploy.sh

uninstall:
	oc delete namespace $(NAMESPACE) --ignore-not-found
