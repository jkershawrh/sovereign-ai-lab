export interface LedgerEntry {
  entry_id: string
  entry_type: string
  agent_id: string
  content: Record<string, unknown> | string
  content_type: string
  source_id: string
  correlation_id: string
  entry_hash: string
  previous_hash: string
  chain_position: number
  written_ts: number
}

export interface ChainVerification {
  all_valid: boolean
  chains: {
    entry_type: string
    chain_valid: boolean
    entries_checked: number
    failure_reason: string
  }[]
}

export interface WriterSummary {
  writers: Record<string, number>
  total: number
}

export interface AttestationData {
  summary: string
  report: Record<string, unknown> | null
  td_config: Record<string, unknown> | null
}

export interface Benchmark {
  name: string
  category?: string
  metric?: string
  score: number
  threshold: number
  direction?: 'min' | 'max'
  pass: boolean
  description?: string
  missing?: boolean
}

export interface AIBOM {
  aibom_version: string
  generated_at: string
  provenance_hash: string
  ledger_entry?: string
  model: {
    name: string
    version: string
    base_model: {
      name: string
      source: string
      license: string
    }
    adaptation: {
      method: string
      training_data_sources: {
        name: string
        description: string
        generation_method: string
        jurisdiction: string
        pii_screened: boolean
        records: number
      }[]
      training_environment: {
        platform: string
        node_type: string
        in_jurisdiction: boolean
      }
    }
    evaluation: {
      framework: string
      benchmarks: Benchmark[]
      all_pass: boolean
    }
  }
}

export interface PromotionDecision {
  decision: string
  ledger_entry_hash: string
  ledger_status?: 'recorded' | 'offline'
  aibom_hash: string
  promoted_at: string | number
}

export interface RegistryEntry {
  name: string
  version: string
  status: string
  aibom_path: string
  aibom_hash: string
  promotion_ledger_hash: string
  serving_endpoint: string
  registered_at: string
}

export interface RouteResult {
  route: string
  response?: string
  model?: string
  reason?: string
}

export interface ClassifyResult {
  route: string
  confidence: number
}

export interface ComplianceLabel {
  name: string
  layer: string
  color: string
  description: string
}

export interface JurisdictionProfile {
  id: string
  name: string
  flag: string
  sectors: string[]
  compliance_labels: ComplianceLabel[]
  opa_policies: string[]
  recommended_models: { name: string; reason: string }[]
  key_concern: string
  aibom_requirements: string[]
}

export type LayerName = 'hardware' | 'platform' | 'models' | 'data' | 'governance' | 'agentControl' | 'execution'
