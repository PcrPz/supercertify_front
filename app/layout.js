// app/layout.js
import { Fustat } from 'next/font/google';
import Footer from '@/components/Footer';
import ServerNavbar from '@/components/ServerNavbar';
import { AuthProvider } from '@/context/AuthContext';
import ToastProvider from '@/components/common/ToastProvider';
import './globals.css';

const fustat = Fustat({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fustat',
});

export const metadata = {
  title: 'SuperCertify - Background Check Service',
  description: 'Easy and reliable background check service',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning={true}>
      <body className={`${fustat.variable} font-fustat flex flex-col min-h-screen`}>
        <AuthProvider>
          <ServerNavbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}