import type {
  AttestationData, AIBOM, PromotionDecision, RegistryEntry,
  RouteResult, ClassifyResult, LedgerEntry, ChainVerification,
  WriterSummary, JurisdictionProfile,
} from './types'

const API = '/api'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return r.json()
}

export const api = {
  attestation: {
    get: () => fetchJson<AttestationData>(`${API}/attestation`),
    refresh: () => fetchJson<{ success: boolean; output: string }>(
      `${API}/attestation/refresh`, { method: 'POST' }),
  },

  model: {
    aibom: () => fetchJson<AIBOM>(`${API}/model/aibom`),
    promotion: () => fetchJson<PromotionDecision>(`${API}/model/promotion`),
    registry: () => fetchJson<RegistryEntry>(`${API}/model/registry`),
  },

  route: (prompt: string, maxTokens = 200) =>
    fetchJson<RouteResult>(`${API}/route`, {
      method: 'POST',
      body: JSON.stringify({ prompt, max_tokens: maxTokens }),
    }),

  classify: (prompt: string) =>
    fetchJson<ClassifyResult>(`${API}/classify`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  policies: {
    list: () => fetchJson<unknown>(`${API}/policies`),
    evaluate: (policy: string, input: Record<string, unknown>) =>
      fetchJson<{ result: boolean }>(`${API}/policies/evaluate`, {
        method: 'POST',
        body: JSON.stringify({ policy, input }),
      }),
  },

  ledger: {
    entries: () => fetchJson<LedgerEntry[]>(`${API}/ledger`),
    verify: () => fetchJson<ChainVerification>(`${API}/ledger/verify`),
    writers: () => fetchJson<WriterSummary>(`${API}/ledger/writers`),
  },

  profiles: {
    list: () => fetchJson<Record<string, JurisdictionProfile>>(`${API}/profiles`),
    get: (id: string) => fetchJson<JurisdictionProfile>(`${API}/profiles/${id}`),
  },
}
