package sovereign.data_residency_gdpr

import future.keywords.if
import future.keywords.in
import future.keywords.contains

# EU profile — GDPR Article 44, EU AI Act Article 13

approved_regions := {
	"AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
	"DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
	"PL", "PT", "RO", "SK", "SI", "ES", "SE", "local",
}

sensitive_classes := {"health", "financial", "biometric", "legal"}

default allow := false

allow if {
	input.destination_region in approved_regions
	not input.data_classification in sensitive_classes
}

allow if {
	input.destination_region == "local"
}

allow if {
	input.destination_region in approved_regions
	input.data_classification in sensitive_classes
	input.adequacy_decision == true
}

deny_reasons contains msg if {
	not allow
	msg := sprintf(
		"GDPR: %v data cannot be processed in %v without adequacy decision",
		[input.data_classification, input.destination_region],
	)
}
