package sovereign.agent_lifecycle

import future.keywords.if
import future.keywords.in
import future.keywords.contains

default allow := false

allow if {
	valid_identity
	valid_action
}

# Production: require SPIFFE identity (startswith "spiffe://")
# Demo: accept any non-empty identity until SPIFFE provisioning is deployed
valid_identity if {
	input.agent_identity != ""
	input.agent_identity != "unknown"
}

valid_action if {
	input.action in {"start", "invoke_tool", "terminate"}
}

deny_reasons contains msg if {
	not valid_identity
	msg := "agent identity required -- anonymous access denied"
}

deny_reasons contains msg if {
	not valid_action
	msg := sprintf("unknown agent action: %v", [input.action])
}
