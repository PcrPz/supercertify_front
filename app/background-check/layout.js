'use client';

import { CheckProvider } from '@/context/CheckContext';


export default function BackgroundCheckLayout({ children }) {
  return (
    <CheckProvider>
      <div className="background-check-layout">
        {children}
      </div>
    </CheckProvider>
  );
}