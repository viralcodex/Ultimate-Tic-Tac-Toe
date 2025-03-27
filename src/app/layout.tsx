import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Super Tic Tac Toe",
  description: "Built by Aviral Shukla",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Ultimate Tic Tac Toe" />
        <meta name="author" content="Aviral Shukla" />
        <title>My Webpage</title>
      </head>
      <body className="antialiased debug-screens bg-amber-400 dotted-bg w-full">
        {children}
      </body>
    </html>
  );
}
