import React from 'react';

// Словарь SVG-иконок
const icons = {
  instagram: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M16.5 7.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM12 9.5A2.5 2.5 0 1 0 12 14.5a2.5 2.5 0 0 0 0-5ZM7 12c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5-5-2.24-5-5Zm10.5 0c0 3.03-2.47 5.5-5.5 5.5S6.5 15.03 6.5 12 8.97 6.5 12 6.5 17.5 8.97 17.5 12Z" stroke="#E1306C" strokeWidth="1.5"/>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l4.93-1.36A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18c-1.61 0-3.13-.39-4.45-1.08l-.32-.17-2.93.81.81-2.93-.17-.32A7.96 7.96 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8Zm4.29-6.1c-.2-.1-1.18-.58-1.36-.65-.18-.07-.31-.1-.44.1-.13.2-.5.65-.62.78-.11.13-.23.15-.43.05-.2-.1-.84-.31-1.6-.99-.59-.53-.99-1.18-1.11-1.38-.12-.2-.01-.3.09-.4.09-.09.2-.23.3-.34.1-.11.13-.2.2-.33.07-.13.03-.25-.01-.35-.05-.1-.44-1.07-.6-1.47-.16-.39-.32-.34-.44-.35-.11-.01-.25-.01-.39-.01-.13 0-.34.05-.52.25-.18.2-.7.68-.7 1.66 0 .98.72 1.93.82 2.07.1.13 1.41 2.16 3.42 2.95.48.17.85.27 1.14.34.48.1.92.09 1.27.06.39-.04 1.18-.48 1.35-.95.17-.47.17-.87.12-.95-.05-.08-.18-.13-.38-.23Z" fill="#25D366"/>
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M21.5 4.5 3.5 11.5c-.7.3-.7 1.3 0 1.6l4.2 1.4 1.4 4.2c.3.7 1.3.7 1.6 0l7-18c.3-.7-.5-1.5-1.2-1.2Z" fill="#0088cc"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M16.5 7.5V12c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4c.34 0 .67.04 1 .09V7.5c0-.28.22-.5.5-.5s.5.22.5.5ZM12 14c1.1 0 2-.9 2-2V8.09c-.33-.05-.66-.09-1-.09-2.21 0-4 1.79-4 4s1.79 4 4 4Z" fill="#000"/>
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C7.61 21 3 16.39 3 11a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.35.27 2.67.76 3.88a1 1 0 0 1-.21 1.11l-2.2 2.2Z" fill="#25D366"/>
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M4 8v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Zm2 0 6 5 6-5" stroke="#FF6B00" strokeWidth="1.5"/>
    </svg>
  ),
  address: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" fill="#FF6B00"/>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M12 7v5l4 2" stroke="#FF6B00" strokeWidth="1.5"/><circle cx="12" cy="12" r="9" stroke="#FF6B00" strokeWidth="1.5"/>
    </svg>
  ),
  delivery: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M3 17V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm16 0V7H5v10h14Z" fill="#FF6B00"/>
    </svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><rect x="4" y="8" width="16" height="8" rx="2" fill="#FF6B00"/>
    </svg>
  ),
  cash: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><rect x="4" y="8" width="16" height="8" rx="2" fill="#4CAF50"/>
    </svg>
  ),
  bank: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><rect x="4" y="8" width="16" height="8" rx="2" fill="#1976D2"/>
    </svg>
  ),
  arrow: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9H15" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/><path d="M11 5L15 9L11 13" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  close: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M7 7L17 17M17 7L7 17" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  left: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M15 19L8 12L15 5" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  right: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M9 5L16 12L9 19" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/></svg>
  ),
};

const Icon = ({ name, size = 24, style = {}, ...props }) => {
  const icon = icons[name];
  if (!icon) return null;
  return React.cloneElement(icon, {
    width: size,
    height: size,
    style: { verticalAlign: 'middle', ...style },
    ...props,
  });
};

export default Icon; 