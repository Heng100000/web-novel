import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/lib/theme-context";
import { Metadata } from "next";
import { Toaster } from "sonner";
import ChatButton from "@/components/chat-button";
import NextTopLoader from "nextjs-toploader";
import PageWrapper from "@/components/page-wrapper";

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
        <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@100;300;400;700;900&family=Hanuman:wght@100..900&family=Kantumruy+Pro:ital,wght@0,100..700;1,100..700&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap" rel="stylesheet" />
        {/* Proactive Hydration Fix: Clear extension-injected attributes before React takes over */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const clean = (target) => {
                  if (target.nodeType === 1) {
                    if (target.hasAttribute('bis_skin_checked')) target.removeAttribute('bis_skin_checked');
                    target.querySelectorAll('[bis_skin_checked]').forEach(el => el.removeAttribute('bis_skin_checked'));
                  }
                };
                clean(document.documentElement);
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                      mutation.target.removeAttribute('bis_skin_checked');
                    }
                    if (mutation.type === 'childList') {
                      mutation.addedNodes.forEach(clean);
                    }
                  });
                });
                observer.observe(document.documentElement, { 
                  childList: true, 
                  subtree: true, 
                  attributes: true, 
                  attributeFilter: ['bis_skin_checked'] 
                });
                window.addEventListener('load', () => clean(document.documentElement));
              })();
            `,
          }}
        />
      </head>
      <body 
        className="min-h-full flex flex-col"
        style={{ fontFamily: "'Kantumruy Pro', 'Inter', sans-serif" }}
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
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <PageWrapper>
                {children}
              </PageWrapper>
              <Toaster position="top-right" richColors />
              <ChatButton />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
