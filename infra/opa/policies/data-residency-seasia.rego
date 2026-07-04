package sovereign.data_residency_seasia

import future.keywords.if
import future.keywords.in
import future.keywords.contains

# Southeast Asia profile — PDPA (Singapore, Thailand), Indonesia PP 71/2019

approved_regions := {"ID", "SG", "PH", "MY", "TH", "VN", "local"}

sensitive_classes := {"personal", "government", "health"}

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
		"PDPA/PP71: %v data cannot be processed in %v",
		[input.data_classification, input.destination_region],
	)
}
