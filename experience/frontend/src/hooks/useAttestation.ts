import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { AttestationData } from '../lib/types'

export function useAttestation() {
  const [data, setData] = useState<AttestationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      await api.attestation.refresh()
      const d = await api.attestation.get()
      setData(d)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.attestation.get()
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error, refresh }
}
