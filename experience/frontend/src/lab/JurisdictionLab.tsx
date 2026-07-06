import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '../lib/api'
import ProofChain from '../components/ProofChain'
import { useLedger } from '../hooks/useLedger'
import type { JurisdictionProfile, ChainVerification, RouteResult } from '../lib/types'

// ─── Categories + test data ────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Nations', items: [
    { id: 'eu', label: 'European Union', flag: '🇪🇺' },
    { id: 'gulf', label: 'Gulf States', flag: '🌙' },
    { id: 'seasia', label: 'Southeast Asia', flag: '🌏' },
  ]},
  { label: 'Enterprise', items: [
    { id: 'enterprise', label: 'Enterprise', flag: '🏢' },
  ]},
  { label: 'Citizen', items: [
    { id: 'citizen', label: 'Individual', flag: '👤' },
  ]},
]

interface PolicyTest {
  label: string
  policy: string
  input: Record<string, unknown>
  expect: boolean
}

interface PromptTest {
  label: string
  prompt: string
}

const JURISDICTION_TESTS: Record<string, { policies: PolicyTest[]; prompts: PromptTest[] }> = {
  eu: {
    policies: [
      { label: 'Health data to US region', policy: 'sovereign/data_residency/allow', input: { destination_region: 'us-east-1', data_classification: 'sensitive_personal' }, expect: false },
      { label: 'General data processed locally', policy: 'sovereign/data_residency/allow', input: { destination_region: 'local', data_classification: 'general' }, expect: true },
      { label: 'Model without AIBOM', policy: 'sovereign/model_promotion/allow', input: { aibom_present: false, training_in_jurisdiction: true, all_benchmarks_pass: true }, expect: false },
    ],
    prompts: [
      { label: 'GDPR retention rules', prompt: 'What are the GDPR data retention rules for patient health records?' },
      { label: 'EU AI Act compliance', prompt: 'What documentation is required under EU AI Act Article 13 for high-risk AI systems?' },
    ],
  },
  gulf: {
    policies: [
      { label: 'Government data abroad', policy: 'sovereign/data_residency/allow', input: { destination_region: 'eu-west-1', data_classification: 'sensitive_personal' }, expect: false },
      { label: 'Local financial processing', policy: 'sovereign/data_residency/allow', input: { destination_region: 'local', data_classification: 'general' }, expect: true },
    ],
    prompts: [
      { label: 'Data localization rules', prompt: 'What are the data localization requirements for financial institutions in this jurisdiction?' },
      { label: 'National AI strategy', prompt: 'How does the national AI strategy address data sovereignty?' },
    ],
  },
  seasia: {
    policies: [
      { label: 'Personal data to foreign region', policy: 'sovereign/data_residency/allow', input: { destination_region: 'us-west-2', data_classification: 'sensitive_personal' }, expect: false },
      { label: 'In-country processing', policy: 'sovereign/data_residency/allow', input: { destination_region: 'local', data_classification: 'general' }, expect: true },
    ],
    prompts: [
      { label: 'PDPA compliance', prompt: 'What are the Personal Data Protection Act requirements for cross-border data transfer?' },
      { label: 'Government cloud policy', prompt: 'What cloud deployment requirements apply to government AI workloads?' },
    ],
  },
  enterprise: {
    policies: [
      { label: 'Anonymous agent access', policy: 'sovereign/model_access/allow', input: { agent_identity: '', requested_model: 'granite-3.2-sovereign' }, expect: false },
      { label: 'Identified agent access', policy: 'sovereign/model_access/allow', input: { agent_identity: 'spiffe://corp/agent-1', requested_model: 'granite-3.2-sovereign' }, expect: true },
      { label: 'Model without benchmarks', policy: 'sovereign/model_promotion/allow', input: { aibom_present: true, training_in_jurisdiction: true, all_benchmarks_pass: false }, expect: false },
    ],
    prompts: [
      { label: 'IP protection inquiry', prompt: 'What are the requirements for protecting model weights as corporate intellectual property?' },
      { label: 'Vendor independence', prompt: 'How do we ensure our AI stack is portable across infrastructure providers?' },
    ],
  },
  citizen: {
    policies: [
      { label: 'Health data to foreign API', policy: 'sovereign/data_residency/allow', input: { destination_region: 'us-east-1', data_classification: 'sensitive_personal' }, expect: false },
      { label: 'Local personal query', policy: 'sovereign/data_residency/allow', input: { destination_region: 'local', data_classification: 'general' }, expect: true },
    ],
    prompts: [
      { label: 'Right to explanation', prompt: 'What does my jurisdiction say about my right to understand AI decisions that affect me?' },
      { label: 'Data ownership', prompt: 'Who owns the data from my conversations with an AI assistant?' },
    ],
  },
}

const STEPS = ['Choose Perspective', 'Test Policies', 'Sovereign Inference', 'Your Proof']

interface Props { onExit: () => void }

export default function JurisdictionLab({ onExit }: Props) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState('eu')
  const [profile, setProfile] = useState<JurisdictionProfile | null>(null)
  const { entries } = useLedger()

  // Step 2 state
  const [policyResults, setPolicyResults] = useState<Record<number, boolean | null>>({})
  const [policyRunning, setPolicyRunning] = useState<number | null>(null)

  // Step 3 state
  const [promptResults, setPromptResults] = useState<Record<number, RouteResult | null>>({})
  const [promptRunning, setPromptRunning] = useState<number | null>(null)

  // Step 4 state
  const [verification, setVerification] = useState<ChainVerification | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    api.profiles.get(selected).then(setProfile).catch(() => {})
    setPolicyResults({})
    setPromptResults({})
  }, [selected])

  const tests = JURISDICTION_TESTS[selected] ?? JURISDICTION_TESTS.eu
  const policyCount = Object.values(policyResults).filter(v => v !== null).length
  const promptCount = Object.values(promptResults).filter(v => v !== null).length

  const runPolicy = async (idx: number) => {
    setPolicyRunning(idx)
    try {
      const r = await api.policies.evaluate(tests.policies[idx].policy, tests.policies[idx].input)
      setPolicyResults(prev => ({ ...prev, [idx]: r.result }))
    } catch { setPolicyResults(prev => ({ ...prev, [idx]: null })) }
    finally { setPolicyRunning(null) }
  }

  const runPrompt = async (idx: number) => {
    setPromptRunning(idx)
    try {
      const r = await api.route(tests.prompts[idx].prompt)
      setPromptResults(prev => ({ ...prev, [idx]: r }))
    } catch (e) {
      setPromptResults(prev => ({ ...prev, [idx]: { route: 'error', reason: String(e) } }))
    } finally { setPromptRunning(null) }
  }

  const verify = async () => {
    setVerifying(true)
    try {
      const v = await api.ledger.verify()
      setVerification(v)
    } catch { /* */ }
    finally { setVerifying(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', fontFamily: 'Red Hat Text, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Lab header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logos/redhat.svg" alt="Red Hat" style={{ height: 20 }} />
          <span style={{ color: 'var(--text-disabled)', fontSize: 22, fontWeight: 300 }}>×</span>
          <img src="/logos/intel.png" alt="Intel" style={{ height: 20 }} />
        </div>
        <span style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 18, fontWeight: 700 }}>Sovereignty Lab</span>
        <button onClick={onExit} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          ← Back to Demo
        </button>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
            cursor: 'pointer', opacity: i === step ? 1 : 0.4, padding: '4px 8px',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < step ? 'var(--rh-green)' : i === step ? 'var(--gpu-amber)' : 'var(--surface-2)',
              color: i <= step ? 'var(--bg-dark)' : 'var(--text-dim)',
              fontFamily: 'Red Hat Mono, monospace', fontSize: 12, fontWeight: 700,
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 13, fontWeight: i === step ? 600 : 400, color: 'var(--text-primary)' }}>{s}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 1, padding: '28px 32px', maxWidth: 860, margin: '0 auto', overflow: 'auto' }}>
          <AnimatePresence mode="wait">

            {/* ─── STEP 1: Choose Perspective ─── */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>What does AI sovereignty look like for you?</h2>
                <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 20 }}>
                  Select your perspective. In the next steps you'll test policies, run inference, and verify the proof chain — all under your sovereignty rules.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                  {CATEGORIES.map(cat => (
                    <div key={cat.label}>
                      <div style={{ fontSize: 10, fontFamily: 'Red Hat Mono, monospace', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{cat.label}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {cat.items.map(j => (
                          <motion.button key={j.id} onClick={() => setSelected(j.id)} whileTap={{ scale: 0.97 }}
                            style={{ flex: 1, padding: '14px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: selected === j.id ? 'var(--surface-2)' : 'var(--surface-1)', color: selected === j.id ? 'var(--text-primary)' : 'var(--text-dim)', borderLeft: selected === j.id ? '3px solid var(--gpu-amber)' : '3px solid transparent', fontSize: 15, textAlign: 'left', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: 22, marginRight: 8 }}>{j.flag}</span>{j.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {profile && (
                  <motion.div key={profile.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ padding: 20, borderRadius: 12, background: 'rgba(245,166,35,0.06)', borderLeft: '4px solid var(--gpu-amber)', marginBottom: 20 }}>
                      <div style={{ fontSize: 11, fontFamily: 'Red Hat Mono, monospace', color: 'var(--gpu-amber)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Why this matters</div>
                      <div style={{ fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.6 }}>{profile.key_concern}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
                      {profile.compliance_labels.map(l => {
                        const colors: Record<string, string> = { hardware: '#00AEEF', platform: '#ee0000', data: '#37a3a3', governance: '#F5A623', models: '#0F62FE' }
                        return (
                          <div key={l.name} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-1)', borderLeft: `3px solid ${colors[l.layer] ?? '#707070'}` }}>
                            <span style={{ fontSize: 10, fontFamily: 'Red Hat Mono, monospace', color: colors[l.layer] ?? '#707070', textTransform: 'uppercase' }}>{l.layer}</span>
                            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{l.name}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{l.description}</div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                <button onClick={() => setStep(1)} style={{ marginTop: 20, background: '#ee0000', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  Test your policies →
                </button>
              </motion.div>
            )}

            {/* ─── STEP 2: Test Policies ─── */}
            {step === 1 && profile && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
                  Test Your Policies — {profile.flag} {profile.name}
                </h2>
                <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 24 }}>
                  These are real OPA policy evaluations running against the {profile.name} sovereignty rules. Every decision is logged.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tests.policies.map((t, i) => {
                    const result = policyResults[i]
                    const isRunning = policyRunning === i
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        style={{ padding: 20, borderRadius: 12, background: 'var(--surface-1)', borderLeft: `3px solid ${result === undefined || result === null ? 'var(--border)' : result === t.expect ? 'var(--rh-green)' : 'var(--rh-red)'}` }}>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{t.label}</div>
                        <div style={{ fontSize: 12, fontFamily: 'Red Hat Mono, monospace', color: 'var(--text-dim)', marginBottom: 10 }}>
                          Policy: {t.policy} · Expected: {t.expect ? 'ALLOW' : 'DENY'}
                        </div>
                        {result === undefined || result === null ? (
                          <button onClick={() => runPolicy(i)} disabled={isRunning}
                            style={{ background: '#ee0000', border: 'none', color: '#fff', padding: '6px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                            {isRunning ? 'Evaluating...' : 'Run Test'}
                          </button>
                        ) : (
                          <span style={{
                            padding: '6px 16px', borderRadius: 10, fontSize: 14, fontFamily: 'Red Hat Mono, monospace', fontWeight: 700,
                            background: result ? 'var(--rh-green)' : 'var(--rh-red)', color: 'var(--bg-dark)',
                          }}>
                            {result ? 'ALLOW' : 'DENY'}
                          </span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {policyCount > 0 && (
                  <div style={{ marginTop: 16, fontSize: 13, fontFamily: 'Red Hat Mono, monospace', color: 'var(--gpu-amber)' }}>
                    ✓ {policyCount} policy decisions evaluated and recorded
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button onClick={() => setStep(0)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>← Back</button>
                  <button onClick={() => setStep(2)} style={{ background: '#ee0000', border: 'none', color: '#fff', padding: '8px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    Run sovereign inference →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 3: Sovereign Inference ─── */}
            {step === 2 && profile && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
                  Sovereign Inference — {profile.flag} {profile.name}
                </h2>
                <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 24 }}>
                  Send jurisdiction-relevant prompts through the sovereign stack. The semantic router classifies each prompt, the model responds, and every event is hash-chained.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {tests.prompts.map((p, i) => {
                    const result = promptResults[i]
                    const isRunning = promptRunning === i
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        style={{ padding: 20, borderRadius: 12, background: 'var(--surface-1)', borderLeft: `3px solid ${result ? 'var(--rh-green)' : 'var(--border)'}` }}>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{p.label}</div>
                        <div style={{ fontSize: 14, color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5 }}>
                          "{p.prompt}"
                        </div>

                        {!result && (
                          <button onClick={() => runPrompt(i)} disabled={isRunning}
                            style={{ background: '#ee0000', border: 'none', color: '#fff', padding: '8px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                            {isRunning ? 'Running inference...' : 'Run'}
                          </button>
                        )}

                        {result && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <span style={{ padding: '4px 12px', borderRadius: 10, fontSize: 12, fontFamily: 'Red Hat Mono, monospace', fontWeight: 600, background: 'var(--rh-green)', color: 'var(--bg-dark)' }}>
                                {result.route?.toUpperCase()}
                              </span>
                              {result.model && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>via {result.model}</span>}
                            </div>
                            {result.response && (
                              <div style={{ padding: 14, background: 'var(--bg-dark)', borderRadius: 8, fontSize: 14, fontFamily: 'Red Hat Mono, monospace', color: 'var(--text-secondary)', maxHeight: 150, overflow: 'auto', lineHeight: 1.6 }}>
                                {result.response}
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: 'var(--gpu-amber)', marginTop: 8, fontFamily: 'Red Hat Mono, monospace' }}>
                              ✓ Classification + inference + routing recorded in ledger
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {promptCount > 0 && (
                  <div style={{ marginTop: 16, fontSize: 13, fontFamily: 'Red Hat Mono, monospace', color: 'var(--gpu-amber)' }}>
                    ✓ {promptCount} sovereign inferences completed, all hash-chained
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button onClick={() => setStep(1)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>← Back</button>
                  <button onClick={() => setStep(3)} style={{ background: '#ee0000', border: 'none', color: '#fff', padding: '8px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    See your proof →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 4: What You Proved ─── */}
            {step === 3 && profile && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
                  What You Just Proved — {profile.flag} {profile.name}
                </h2>
                <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 24 }}>
                  In this session you didn't just see a demo. You exercised a sovereign AI stack and generated real evidence.
                </p>

                {/* Sovereignty proofs — what the user actually proved */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {[
                    { icon: '🔒', title: 'Your data stayed in your jurisdiction', detail: `You tested ${policyCount} residency policies. Sensitive data was denied from leaving your borders. General data was processed locally. Every decision was logged.`, color: '#37a3a3' },
                    { icon: '🧠', title: 'Your model is open and documented', detail: 'The model that served you has a full AI Bill of Materials — base model, training data, evaluation results, and jurisdiction. It was promoted to production through an OPA policy gate.', color: '#0F62FE' },
                    { icon: '🛡️', title: 'Your prompts were classified and governed', detail: `You ran ${promptCount} sovereign inferences. Each prompt was classified before reaching the model. Sensitive content was flagged. Injection attempts were blocked. Routing decisions were enforced.`, color: '#5e40be' },
                    { icon: '⛓️', title: 'Every decision is independently verifiable', detail: 'Every policy evaluation, every routing decision, every inference request produced a hash-chained entry in a tamper-evident ledger. Modify any entry and the chain breaks.', color: '#F5A623' },
                  ].map((proof, i) => (
                    <motion.div key={proof.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      style={{ padding: 20, borderRadius: 12, background: 'var(--surface-1)', borderLeft: `4px solid ${proof.color}` }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 20 }}>{proof.icon}</span>
                        <span style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Red Hat Display, sans-serif' }}>{proof.title}</span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                        {proof.detail}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Verify button */}
                <motion.button onClick={verify} disabled={verifying} whileTap={{ scale: 0.97 }}
                  style={{ background: '#ee0000', border: 'none', color: '#fff', padding: '12px 32px', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600, display: 'block', margin: '0 auto 24px' }}>
                  {verifying ? 'Verifying...' : 'Verify the proof chain'}
                </motion.button>

                {verification && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    style={{ padding: 24, borderRadius: 14, textAlign: 'center', background: verification.all_valid ? 'rgba(99,153,61,0.08)' : 'rgba(238,0,0,0.08)', border: `2px solid ${verification.all_valid ? 'var(--rh-green)' : 'var(--rh-red)'}`, marginBottom: 24 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Red Hat Display, sans-serif', color: verification.all_valid ? 'var(--rh-green)' : 'var(--rh-red)', marginBottom: 8 }}>
                      {verification.all_valid ? 'SOVEREIGNTY VERIFIED' : 'VERIFICATION FAILED'}
                    </div>
                    <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
                      {verification.all_valid
                        ? `Every governance decision from this session is recorded and intact. No entry has been tampered with. This is what sovereign AI looks like for ${profile.name}.`
                        : 'The proof chain has been compromised. One or more entries have been modified.'}
                    </div>
                  </motion.div>
                )}

                {/* What this means for you */}
                <div style={{ padding: 20, background: 'var(--surface-1)', borderRadius: 12, marginBottom: 20 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Red Hat Display, sans-serif', marginBottom: 12 }}>
                    What this means for {profile.name === 'Individual' ? 'you' : profile.name}
                  </div>
                  <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {profile.key_concern}
                  </div>
                  <div style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.7, marginTop: 12 }}>
                    The stack you just tested provides exactly this. Open-weight models you can possess. Policies that enforce your rules. A proof chain that satisfies your regulators. All of it running on infrastructure you control.
                  </div>
                </div>

                {/* Next steps — not developer commands */}
                <div style={{ padding: 20, background: 'var(--surface-1)', borderRadius: 12, marginBottom: 20 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Red Hat Display, sans-serif', marginBottom: 12 }}>
                    What happens next
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { step: 'Take the proof with you', detail: 'The root hash from this session is your receipt. It proves every decision that was made — and that none were altered.' },
                      { step: 'Run it on your infrastructure', detail: 'This entire stack is open source (Apache 2.0). It runs on a single Intel Xeon node. No GPU required.' },
                      { step: 'Configure it for your jurisdiction', detail: `The ${profile.name} profile you tested is one of five. The OPA policies, AIBOM requirements, and compliance labels adapt to your regulatory environment.` },
                      { step: 'Scale to production', detail: 'GPU confidential compute, multi-node inference, Kagenti agent lifecycle management, and OpenShell process-level sandboxing are the next layers.' },
                    ].map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gpu-amber)', color: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{s.step}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginTop: 2 }}>{s.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button onClick={() => setStep(2)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>← Back</button>
                  <button onClick={onExit} style={{ background: '#ee0000', border: 'none', color: '#fff', padding: '8px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    Back to Demo
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ProofChain sidebar — visible in steps 2 and 3 */}
        {(step === 1 || step === 2) && (
          <div style={{ width: 220, padding: '28px 16px', borderLeft: '1px solid var(--border)', overflow: 'auto' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 10, fontFamily: 'Red Hat Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live Proof Chain
            </div>
            <ProofChain entries={entries} variant="compact" />
          </div>
        )}
      </div>
    </div>
  )
}
