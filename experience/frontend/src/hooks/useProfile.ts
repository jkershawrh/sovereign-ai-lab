import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { JurisdictionProfile } from '../lib/types'

export function useProfile(profileId: string) {
  const [profile, setProfile] = useState<JurisdictionProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.resolve()
      .then(() => {
        if (!cancelled) setLoading(true)
        return api.profiles.get(profileId)
      })
      .then(profile => {
        if (!cancelled) setProfile(profile)
      })
      .catch(() => {
        if (!cancelled) setProfile(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [profileId])

  return { profile, loading }
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Record<string, JurisdictionProfile>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.profiles.list()
      .then(setProfiles)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { profiles, loading }
}
