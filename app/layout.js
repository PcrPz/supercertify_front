import { Fustat } from 'next/font/google';
import Footer from '@/components/Footer';
import './globals.css';
import ServerNavbar from '@/components/ServerNavbar';

// กำหนดค่า Google font
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
    <html lang="th">
      <body className={`${fustat.variable} font-fustat`}>
        <ServerNavbar/>
        <main>
          {children}
        </main>
        <Footer/>
      </body>
    </html>
  );
}