"use client";

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ServerNavbar() {
  // ใช้ usePathname แทน headers (ซึ่งใช้ได้เฉพาะใน Server Component)
  const pathname = usePathname();
  
  return <Navbar activePath={pathname} />;
}