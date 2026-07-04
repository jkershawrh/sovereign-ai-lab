import { motion } from 'motion/react'

export default function SplashIntro() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', cursor: 'pointer',
      textAlign: 'center', padding: '0 40px',
    }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}
      >
        <img src="/logos/redhat.svg" alt="Red Hat" style={{ height: 28 }} />
        <span style={{ color: 'var(--text-disabled)', fontSize: 28, fontWeight: 300 }}>×</span>
        <img src="/logos/intel.png" alt="Intel" style={{ height: 28 }} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        style={{
          fontFamily: 'Red Hat Display, sans-serif',
          fontSize: 56, fontWeight: 800, lineHeight: 1.1,
          margin: '0 0 16px',
          letterSpacing: -1,
        }}
      >
        Sovereign AI Lab
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        style={{
          fontFamily: 'Red Hat Text, sans-serif',
          fontSize: 20, color: 'var(--text-secondary)',
          margin: 0,
        }}
      >
        Provable AI Governance on Intel Hardware
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.4, 0.8, 0.4] }}
        transition={{ delay: 2.2, duration: 3, repeat: Infinity }}
        style={{
          fontFamily: 'Red Hat Mono, monospace',
          fontSize: 12, color: 'var(--text-dim)',
          marginTop: 48,
        }}
      >
        click to begin
      </motion.p>
    </div>
  )
}
