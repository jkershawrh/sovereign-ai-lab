import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { JurisdictionProfile } from '../lib/types'

export function useProfile(profileId: string) {
  const [profile, setProfile] = useState<JurisdictionProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.profiles.get(profileId)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
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
