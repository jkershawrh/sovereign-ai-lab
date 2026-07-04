package sovereign.data_residency_gulf_test

import data.sovereign.data_residency_gulf
import future.keywords.if

test_allow_local if {
	data_residency_gulf.allow with input as {
		"destination_region": "local",
		"data_classification": "government",
	}
}

test_allow_uae_general if {
	data_residency_gulf.allow with input as {
		"destination_region": "AE",
		"data_classification": "general",
	}
}

test_deny_national_id_to_foreign if {
	not data_residency_gulf.allow with input as {
		"destination_region": "US",
		"data_classification": "national_id",
	}
}

test_deny_government_to_foreign if {
	not data_residency_gulf.allow with input as {
		"destination_region": "DE",
		"data_classification": "government",
	}
}
