package sovereign.agent_lifecycle

import future.keywords.if
import future.keywords.in
import future.keywords.contains

default allow := false

allow if {
	valid_identity
	valid_action
}

valid_identity if {
	startswith(input.agent_identity, "spiffe://")
}

valid_action if {
	input.action in {"start", "invoke_tool", "terminate"}
}

deny_reasons contains msg if {
	not valid_identity
	msg := "agent must have a valid SPIFFE identity"
}

deny_reasons contains msg if {
	not valid_action
	msg := sprintf("unknown agent action: %v", [input.action])
}
