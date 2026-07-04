package sovereign.data_residency_test

import data.sovereign.data_residency
import future.keywords.if

test_allow_local if {
	data_residency.allow with input as {
		"destination_region": "local",
		"data_classification": "general",
	}
}

test_allow_local_sensitive if {
	data_residency.allow with input as {
		"destination_region": "local",
		"data_classification": "sensitive_personal",
	}
}

test_deny_sensitive_to_foreign if {
	not data_residency.allow with input as {
		"destination_region": "us-east-1",
		"data_classification": "sensitive_personal",
	}
}

test_allow_approved_region_general if {
	data_residency.allow with input as {
		"destination_region": "eu-west-1",
		"data_classification": "general",
	}
		with data.jurisdiction.approved_regions as ["eu-west-1"]
}
