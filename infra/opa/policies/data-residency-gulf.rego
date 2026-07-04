package sovereign.data_residency_gulf

import future.keywords.if
import future.keywords.in
import future.keywords.contains

# Gulf states profile — UAE Data Protection Law

approved_regions := {"AE", "SA", "KW", "BH", "OM", "QA", "local"}

sensitive_classes := {"national_id", "government", "financial", "health"}

default allow := false

allow if {
	input.destination_region in approved_regions
	not input.data_classification in sensitive_classes
}

allow if {
	input.destination_region == "local"
}

deny_reasons contains msg if {
	not allow
	msg := sprintf(
		"Gulf data residency: %v data must remain in-jurisdiction, cannot route to %v",
		[input.data_classification, input.destination_region],
	)
}
