import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function HashBadge({ hash, label, truncate = true }) {
  const [copied, setCopied] = useState(false);

  if (!hash) return null;

  const isGenesis = hash === 'GENESIS';

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const displayText = isGenesis
    ? 'GENESIS'
    : truncate && hash.length > 20
    ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`
    : hash;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.2rem' }}>
      {label && (
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
      )}
      <div
        className={`hash-pill ${isGenesis ? 'badge-genesis' : ''}`}
        onClick={handleCopy}
        style={{ cursor: 'pointer', userSelect: 'all' }}
        title={`Click to copy full SHA-256 hash: ${hash}`}
      >
        <code style={{ color: isGenesis ? '#94a3b8' : '#38bdf8' }}>{displayText}</code>
        {copied ? (
          <Check size={13} style={{ color: 'var(--success)' }} />
        ) : (
          <Copy size={13} style={{ opacity: 0.6 }} />
        )}
      </div>
    </div>
  );
}
