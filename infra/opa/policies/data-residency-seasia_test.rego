package sovereign.data_residency_seasia_test

import data.sovereign.data_residency_seasia
import future.keywords.if

test_allow_local if {
	data_residency_seasia.allow with input as {
		"destination_region": "local",
		"data_classification": "personal",
	}
}

test_allow_singapore_general if {
	data_residency_seasia.allow with input as {
		"destination_region": "SG",
		"data_classification": "general",
	}
}

test_deny_personal_to_foreign if {
	not data_residency_seasia.allow with input as {
		"destination_region": "US",
		"data_classification": "personal",
	}
}

test_deny_government_to_foreign if {
	not data_residency_seasia.allow with input as {
		"destination_region": "DE",
		"data_classification": "government",
	}
}
