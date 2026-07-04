package sovereign.data_residency_gdpr_test

import data.sovereign.data_residency_gdpr
import future.keywords.if

test_allow_eu_general if {
	data_residency_gdpr.allow with input as {
		"destination_region": "DE",
		"data_classification": "general",
	}
}

test_allow_local if {
	data_residency_gdpr.allow with input as {
		"destination_region": "local",
		"data_classification": "health",
	}
}

test_deny_health_to_non_eu if {
	not data_residency_gdpr.allow with input as {
		"destination_region": "US",
		"data_classification": "health",
	}
}

test_allow_sensitive_with_adequacy if {
	data_residency_gdpr.allow with input as {
		"destination_region": "FR",
		"data_classification": "financial",
		"adequacy_decision": true,
	}
}

test_deny_sensitive_without_adequacy if {
	not data_residency_gdpr.allow with input as {
		"destination_region": "FR",
		"data_classification": "financial",
	}
}
