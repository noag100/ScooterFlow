import React from 'react';

const ScooterFlowFinalVersion = () => {
  return (
    <svg width="450" height="180" viewBox="0 0 450 180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#00F2FE', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#4FACFE', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* הקורקינט המקורי שאהבת */}
      <g transform="translate(40, 30)">
        {/* שלדה אחורית ומשטח דריכה */}
        <rect x="40" y="85" width="80" height="8" rx="4" fill="#2D3436" />
        <path d="M120 89 L145 25" stroke="#2D3436" strokeWidth="6" strokeLinecap="round" />
        
        {/* כידון */}
        <path d="M135 25 L155 25" stroke="#2D3436" strokeWidth="4" strokeLinecap="round" />
        <circle cx="145" cy="25" r="3" fill="url(#neonGrad)" />

        {/* גלגלים עם אפקט "חישוק" */}
        <circle cx="40" cy="95" r="12" fill="#2D3436" />
        <circle cx="40" cy="95" r="7" fill="none" stroke="url(#neonGrad)" strokeWidth="2" />
        
        <circle cx="145" cy="95" r="12" fill="#2D3436" />
        <circle cx="145" cy="95" r="7" fill="none" stroke="url(#neonGrad)" strokeWidth="2" />

        {/* קווי מהירות (במקום הפס התכלת הפשוט) */}
        <g stroke="url(#neonGrad)" strokeWidth="2" strokeLinecap="round">
            {/* קווים מאחורי הגלגל האחורי */}
            <line x1="0" y1="88" x2="25" y2="88" />
            <line x1="-15" y1="95" x2="15" y2="95" opacity="0.6" />
            <line x1="-5" y1="102" x2="20" y2="102" opacity="0.4" />
            
            {/* קו רוח מעל המשטח */}
            <path d="M50 75 Q70 70 90 75" fill="none" opacity="0.5" />
        </g>
      </g>

      {/* טקסט Scooter - הפונט המקורי */}
      <text x="200" y="85" style={{ 
        fontFamily: 'Arial Black, sans-serif', 
        fontSize: '38px', 
        fill: '#2D3436' 
      }}>
        Scooter
      </text>

      {/* טקסט Flow - פונט זורם (Cursive) נקי */}
      <text x="200" y="130" style={{ 
        fontFamily: '"Segoe Script", "Comic Sans MS", cursive', 
        fontSize: '52px', 
        fontWeight: 'bold', 
        fill: 'url(#neonGrad)',
        letterSpacing: '-1px'
      }}>
        Flow
      </text>

      {/* סיומת זרימה קטנה בסוף */}
      {/* <path d="M335 125 C370 115 400 120 420 130" fill="none" stroke="url(#neonGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.7" /> */}
    </svg>
  );
};

export default ScooterFlowFinalVersion;