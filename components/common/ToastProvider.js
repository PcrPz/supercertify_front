"use client";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      limit={3}
      // ใช้ className แทน style เพื่อให้ CSS จาก globals.css ทำงานได้
      className="custom-toast-container"
      // ลบ style และ toastStyle ออก เพื่อให้ใช้ CSS จาก globals.css
    />
  );
}