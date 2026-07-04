package sovereign.model_promotion_test

import data.sovereign.model_promotion
import future.keywords.if

test_allow_valid_model if {
	model_promotion.allow with input as {
		"aibom_present": true,
		"training_in_jurisdiction": true,
		"all_benchmarks_pass": true,
	}
}

test_deny_missing_aibom if {
	not model_promotion.allow with input as {
		"aibom_present": false,
		"training_in_jurisdiction": true,
		"all_benchmarks_pass": true,
	}
}

test_deny_out_of_jurisdiction if {
	not model_promotion.allow with input as {
		"aibom_present": true,
		"training_in_jurisdiction": false,
		"all_benchmarks_pass": true,
	}
}

test_deny_failed_benchmarks if {
	not model_promotion.allow with input as {
		"aibom_present": true,
		"training_in_jurisdiction": true,
		"all_benchmarks_pass": false,
	}
}
