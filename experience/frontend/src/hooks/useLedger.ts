import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import type { LedgerEntry } from '../lib/types'

export function useLedger(pollMs = 2000) {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [newEntries, setNewEntries] = useState<LedgerEntry[]>([])
  const lastCount = useRef(0)

  useEffect(() => {
    let active = true
    const poll = async () => {
      try {
        const all = await api.ledger.entries()
        if (!active) return
        setEntries(all)
        if (all.length > lastCount.current) {
          setNewEntries(all.slice(lastCount.current))
        }
        lastCount.current = all.length
      } catch { /* ignore poll errors */ }
    }
    poll()
    const id = setInterval(poll, pollMs)
    return () => { active = false; clearInterval(id) }
  }, [pollMs])

  return { entries, newEntries }
}
