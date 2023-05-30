import './globals.css';
import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from '@clerk/themes';
import Header from "@/components/header";
import Div100vh from 'react-div-100vh';

import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Ragents',
  description: 'Research Agents',
  viewport: 'width=device-width, initial-scale=1.0'
};

const isPublicPage = () => { return false; }

export default function RootLayout({ children }:
  { children: React.ReactNode; }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#00A700",
          borderRadius: "0px",
        },
      }}
    >
      <html lang="en"
        className={`${inter.className} h-full scroll-smooth antialiased`}// TODO: NEEDED? 
      >
        <head>
          <title>Ragents</title>
        </head>
        <body className="bg-gray-900">
          <div className='bg-gray-900 flex flex-col'>
            <Header />
            {children}
          </div>)
        </body>
      </html>
    </ClerkProvider>
  );
}
