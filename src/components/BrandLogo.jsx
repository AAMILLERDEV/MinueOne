export default function BrandLogo({ className = '' }) {
  return (
    <div className={`flex items-center ${className}`}>
      <span
        style={{
          fontFamily: "'Raleway', -apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 600,
          fontSize: '1.5rem',
          letterSpacing: '-0.5px',
          color: '#475569',
        }}
      >
        Minus
      </span>
      <span
        style={{
          writingMode: 'vertical-lr',
          transform: 'rotate(180deg)',
          fontFamily: "'Raleway', -apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 800,
          fontSize: '0.55rem',
          letterSpacing: '1px',
          lineHeight: 1,
          marginLeft: '1px',
        }}
      >
        <span style={{ color: '#93c5fd' }}>O</span>
        <span style={{ color: '#3b82f6' }}>N</span>
        <span style={{ color: '#1d4ed8' }}>E</span>
      </span>
    </div>
  );
}
