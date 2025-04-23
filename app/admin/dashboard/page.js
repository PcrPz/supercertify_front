// app/admin/dashboard/page.js
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import axios from 'axios';

export default async function AdminDashboardPage() {
 const cookieStore = await cookies();
 const token = cookieStore.get('access_token')?.value;

 // ถ้าไม่มี token
 if (!token) {
   redirect('/login');
 }

 try {
   const apiUrl = process.env.API_URL || 'http://localhost:3000';
   const response = await axios.get(`${apiUrl}/auth/me`, {
     headers: {
       Authorization: `Bearer ${token}`
     }
   });

   // ตรวจสอบ Role
   if (response.data.role !== 'admin') {
     redirect('/dashboard');
   }

   // ถ้าเป็น Admin
   return (
     <div>
       <h1>Admin Dashboard</h1>
       <p>ยินดีต้อนรับ, {response.data.username}</p>
     </div>
   );
 } catch (error) {
   // กรณีเกิดข้อผิดพลาด
   redirect('/dashboard');
 }
}