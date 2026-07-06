SHELL := /bin/bash
SCRIPT_DIR := $(dir $(lastword $(MAKEFILE_LIST)))/../dev-cluster-1
NAMESPACE ?= sovereign-ai-lab

.PHONY: install uninstall

install:
	NS=$(NAMESPACE) bash $(SCRIPT_DIR)/deploy.sh

uninstall:
	oc delete namespace $(NAMESPACE) --ignore-not-found
