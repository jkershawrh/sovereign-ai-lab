package sovereign.model_access

import future.keywords.if
import future.keywords.contains

default allow := false

allow if {
	input.agent_identity != ""
	input.agent_identity != "unknown"
	input.requested_model in data.models.approved_models
}

deny_reasons contains msg if {
	input.agent_identity == ""
	msg := "agent identity required -- anonymous access denied"
}

deny_reasons contains msg if {
	input.agent_identity == "unknown"
	msg := "agent identity unverifiable -- access denied"
}

deny_reasons contains msg if {
	not input.requested_model in data.models.approved_models
	msg := sprintf("model %v not in approved model list", [input.requested_model])
}
