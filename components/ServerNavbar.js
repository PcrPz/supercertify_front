import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import Navbar from './Navbar';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  
  if (!token) return null;
  
  try {
    const response = await fetch(`${process.env.API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (!response.ok) return null;
    
    return response.json();
  } catch (error) {
    return null;
  }
}

export default async function ServerNavbar() {
  const user = await getUser();
  
  // ดึง path ปัจจุบัน
  const headersList = await headers();
  const activePath = headersList.get('x-invoke-path') || '';

  return <Navbar user={user} activePath={activePath} />;
}