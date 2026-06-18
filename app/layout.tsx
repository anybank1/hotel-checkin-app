import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ระบบบันทึกการเข้าพัก | โรงแรม',
  description: 'แอปบันทึกการเข้าพักของแขกในโรงแรม อย่างง่าย',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
