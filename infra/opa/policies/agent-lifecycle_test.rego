package sovereign.agent_lifecycle_test

import data.sovereign.agent_lifecycle
import future.keywords.if

test_allow_valid_agent_start if {
	agent_lifecycle.allow with input as {
		"agent_identity": "spiffe://demo/agent-1",
		"action": "start",
	}
}

test_allow_invoke_tool if {
	agent_lifecycle.allow with input as {
		"agent_identity": "spiffe://demo/agent-1",
		"action": "invoke_tool",
	}
}

test_allow_terminate if {
	agent_lifecycle.allow with input as {
		"agent_identity": "spiffe://demo/agent-1",
		"action": "terminate",
	}
}

test_deny_no_spiffe if {
	not agent_lifecycle.allow with input as {
		"agent_identity": "plain-agent-id",
		"action": "start",
	}
}

test_deny_unknown_action if {
	not agent_lifecycle.allow with input as {
		"agent_identity": "spiffe://demo/agent-1",
		"action": "delete_data",
	}
}
