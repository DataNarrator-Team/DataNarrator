import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata = {
  title: "DataNarrator",
  description: "AI Data Visualization",
}

// Production analytics initialization
function ProductionAnalytics() {
  if (process.env.NODE_ENV !== "production") return null
  return <Analytics />
}

// Root layout structure
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('datanarrator_theme_mode');
                  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground transition-colors duration-200">
        {children}
        <ProductionAnalytics />
      </body>
    </html>
  )
}