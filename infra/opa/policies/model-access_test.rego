package sovereign.model_access_test

import data.sovereign.model_access
import future.keywords.if

test_allow_valid_agent if {
	model_access.allow with input as {
		"agent_identity": "spiffe://demo/agent-1",
		"requested_model": "granite-3.2-sovereign",
	}
		with data.models.approved_models as ["granite-3.2-sovereign"]
}

test_deny_anonymous if {
	not model_access.allow with input as {
		"agent_identity": "",
		"requested_model": "granite-3.2-sovereign",
	}
		with data.models.approved_models as ["granite-3.2-sovereign"]
}

test_deny_unknown if {
	not model_access.allow with input as {
		"agent_identity": "unknown",
		"requested_model": "granite-3.2-sovereign",
	}
		with data.models.approved_models as ["granite-3.2-sovereign"]
}

test_deny_unapproved_model if {
	not model_access.allow with input as {
		"agent_identity": "spiffe://demo/agent-1",
		"requested_model": "gpt-4",
	}
		with data.models.approved_models as ["granite-3.2-sovereign"]
}
