# TDX Trust Domain

## Scripts

- `create-td.sh` — Creates a TDX trust domain (simulated on non-TDX hardware)
- `attest.sh` — Calls Intel Trust Authority for attestation (simulated if no ITA_API_KEY)
- `verify-quote.sh` — Offline verification of attestation report

## Requirements

- **TDX hardware**: Intel Xeon with TDX enabled (for real attestation)
- **ITA_API_KEY**: Intel Trust Authority API key in `.env`
- **Simulation mode**: All scripts fall back to simulation on non-TDX hardware

## Files generated

- `td-config.json` — Trust domain configuration
- `attestation-report.json` — ITA attestation response (or simulated)
- `attestation-summary.txt` — Human-readable summary
- `.td-running` — Sentinel file (gitignored)
