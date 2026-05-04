import "./globals.css";
import { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Book Novel | Premium Bookstore",
  description: "Your digital gateway to the world of premium novels and reading experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased transition-colors duration-300"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Kantumruy+Pro:ital,wght@0,100..700;1,100..700&family=Siemreap&family=Battambang:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className="min-h-full flex flex-col font-kantumruy"
        suppressHydrationWarning
      >
        <NextTopLoader
          color="#3b6016"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #3b6016,0 0 5px #3b6016"
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
