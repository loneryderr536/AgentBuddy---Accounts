import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentBuddy - Accounting & Google Sheets Agent',
  description: 'AI-powered Daybook, Ledger, and Account Statement manager with camera OCR receipt scanning.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#f5f7fa] text-[#28283c] min-h-screen selection:bg-[#dcf0ff] selection:text-[#28283c]">
        {children}
      </body>
    </html>
  );
}
