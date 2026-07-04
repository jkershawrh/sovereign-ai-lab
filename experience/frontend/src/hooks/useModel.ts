import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { AIBOM, PromotionDecision, RegistryEntry } from '../lib/types'

export function useModel() {
  const [aibom, setAibom] = useState<AIBOM | null>(null)
  const [promotion, setPromotion] = useState<PromotionDecision | null>(null)
  const [registry, setRegistry] = useState<RegistryEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.model.aibom().then(setAibom),
      api.model.promotion().then(setPromotion),
      api.model.registry().then(setRegistry),
    ])
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { aibom, promotion, registry, loading }
}
