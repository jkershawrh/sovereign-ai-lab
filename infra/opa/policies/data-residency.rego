package sovereign.data_residency

import future.keywords.if
import future.keywords.in
import future.keywords.contains

default allow := false

allow if {
	input.destination_region in data.jurisdiction.approved_regions
	input.data_classification != "sensitive_personal"
}

allow if {
	input.destination_region == "local"
}

deny_reasons contains msg if {
	not allow
	msg := sprintf(
		"data residency violation: %v cannot route to %v",
		[input.data_classification, input.destination_region],
	)
}
