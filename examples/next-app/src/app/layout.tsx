import './globals.css';

import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import React from 'react';

const inter = Inter({subsets: ['latin']});

export const metadata: Metadata = {
  title: 'LoopAuth Next Example',
  description: '%s | LoopAuth Next Example',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
