package sovereign.model_promotion

import future.keywords.if
import future.keywords.contains

default allow := false

allow if {
	input.aibom_present == true
	input.training_in_jurisdiction == true
	input.all_benchmarks_pass == true
}

deny_reasons contains msg if {
	not input.aibom_present
	msg := "AIBOM not present -- model provenance unverifiable"
}

deny_reasons contains msg if {
	not input.training_in_jurisdiction
	msg := "training environment was not in-jurisdiction"
}

deny_reasons contains msg if {
	not input.all_benchmarks_pass
	msg := "model did not pass all required evaluation benchmarks"
}
