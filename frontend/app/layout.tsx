import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import LandingNavbar from '@/components/LandingNavbar';
import { GoogleOAuthProvider } from '@react-oauth/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ContentWala AI',
  description: 'Turn long videos into viral 9:16 clips automatically.',
  icons: {
    icon: '/logo.png?v=9',
    apple: '/logo.png?v=9'
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen selection:bg-purple-500/30`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy"}>
          <Navbar />
          <LandingNavbar />
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
