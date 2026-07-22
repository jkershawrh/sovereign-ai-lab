package sovereign.data_storage

import future.keywords.if
import future.keywords.contains

default allow := false

allow if {
    input.encryption_at_rest == true
    input.storage_in_jurisdiction == true
}

deny_reasons contains msg if {
    not input.encryption_at_rest
    msg := "data at rest must be encrypted -- unencrypted storage violates data sovereignty"
}

deny_reasons contains msg if {
    not input.storage_in_jurisdiction
    msg := "storage must be in-jurisdiction"
}
