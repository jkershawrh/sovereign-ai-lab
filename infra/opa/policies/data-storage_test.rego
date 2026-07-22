package sovereign.data_storage_test

import data.sovereign.data_storage
import future.keywords.if

test_allow_encrypted_and_in_jurisdiction if {
    data_storage.allow with input as {
        "encryption_at_rest": true,
        "storage_in_jurisdiction": true,
    }
}

test_deny_not_encrypted if {
    not data_storage.allow with input as {
        "encryption_at_rest": false,
        "storage_in_jurisdiction": true,
    }
}

test_deny_not_in_jurisdiction if {
    not data_storage.allow with input as {
        "encryption_at_rest": true,
        "storage_in_jurisdiction": false,
    }
}

test_deny_both_missing if {
    not data_storage.allow with input as {
        "encryption_at_rest": false,
        "storage_in_jurisdiction": false,
    }
}

test_deny_reason_not_encrypted if {
    reasons := data_storage.deny_reasons with input as {
        "encryption_at_rest": false,
        "storage_in_jurisdiction": true,
    }
    reasons["data at rest must be encrypted -- unencrypted storage violates data sovereignty"]
}

test_deny_reason_not_in_jurisdiction if {
    reasons := data_storage.deny_reasons with input as {
        "encryption_at_rest": true,
        "storage_in_jurisdiction": false,
    }
    reasons["storage must be in-jurisdiction"]
}

test_deny_reasons_both_missing if {
    reasons := data_storage.deny_reasons with input as {
        "encryption_at_rest": false,
        "storage_in_jurisdiction": false,
    }
    count(reasons) == 2
}
