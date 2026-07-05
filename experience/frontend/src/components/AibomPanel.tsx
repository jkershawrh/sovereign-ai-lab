import { useModel } from '../hooks/useModel'
import type { Benchmark } from '../lib/types'

function benchmarkPercent(benchmark: Benchmark) {
  if (benchmark.direction === 'max') {
    if (benchmark.score <= 0) return 100
    return Math.min(100, (benchmark.threshold / benchmark.score) * 100)
  }
  return Math.min(100, (benchmark.score / Math.max(benchmark.threshold, 0.01)) * 100)
}

function thresholdLabel(benchmark: Benchmark) {
  return `${benchmark.direction === 'max' ? '<=' : '>='} ${benchmark.threshold}`
}

export default function AibomPanel() {
  const { aibom, promotion, loading } = useModel()

  if (loading) return <div style={{ color: 'var(--text-dim)' }}>Loading model provenance...</div>
  if (!aibom) return <div style={{ color: 'var(--rh-orange)' }}>AIBOM not available</div>

  const model = aibom.model

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontFamily: 'Red Hat Display, sans-serif', fontSize: '1.25rem', margin: 0 }}>
        Model Provenance
      </h2>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>Base Model</div>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>{model.base_model.name}</div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <span style={{
            padding: '2px 8px', borderRadius: '8px', fontSize: '11px',
            background: 'var(--rh-green-dim, rgba(99,153,61,0.12))', color: 'var(--rh-green)',
          }}>
            {model.base_model.license}
          </span>
          <span style={{
            padding: '2px 8px', borderRadius: '8px', fontSize: '11px',
            background: 'var(--ibm-blue-dim, rgba(15,98,254,0.12))', color: 'var(--ibm-blue)',
          }}>
            Open Weights
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>Adaptation</div>
        <div style={{ fontSize: '13px' }}>
          <div>Method: <strong>{model.adaptation.method}</strong></div>
          <div>Records: <strong>{model.adaptation.training_data_sources[0]?.records}</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            In-jurisdiction:
            <span style={{
              color: model.adaptation.training_environment.in_jurisdiction
                ? 'var(--rh-green)' : 'var(--rh-red)',
            }}>
              {model.adaptation.training_environment.in_jurisdiction ? '✓' : '✗'}
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>Evaluation</div>
        {model.evaluation.benchmarks.map(b => (
          <div key={b.name} style={{ marginBottom: '8px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '13px', marginBottom: '4px',
            }}>
              <span>{b.name}</span>
              <span style={{
                fontFamily: 'Red Hat Mono, monospace',
                color: b.pass ? 'var(--rh-green)' : 'var(--rh-red)',
              }}>
                {b.score.toFixed(3)} {thresholdLabel(b)} {b.pass ? 'PASS' : 'FAIL'}
              </span>
            </div>
            <div style={{
              height: '6px', background: 'var(--surface-1)', borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '3px',
                width: `${benchmarkPercent(b)}%`,
                background: b.pass ? 'var(--rh-green)' : 'var(--rh-red)',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {promotion && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 16px', background: 'var(--surface-1)', borderRadius: '8px',
        }}>
          <span style={{
            padding: '4px 12px', borderRadius: '12px', fontSize: '12px',
            fontFamily: 'Red Hat Mono, monospace', fontWeight: 600,
            background: promotion.decision === 'allow' ? 'var(--rh-green)' : 'var(--rh-red)',
            color: 'var(--bg-dark)',
          }}>
            {promotion.decision.toUpperCase()}
          </span>
          <span style={{ fontSize: '12px', fontFamily: 'Red Hat Mono, monospace', color: 'var(--text-dim)' }}>
            {aibom.provenance_hash.slice(0, 16)}...
          </span>
        </div>
      )}
    </div>
  )
}
