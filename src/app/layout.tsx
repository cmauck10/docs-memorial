import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "In Loving Memory of Dr. Michael Mauck",
  description: "A memorial tribute to the amazing Dr. Michael Mauck. Share your memories and celebrate his life.",
  openGraph: {
    title: "In Loving Memory of Dr. Michael Mauck",
    description: "A memorial tribute to the amazing Dr. Michael Mauck. Share your memories and celebrate his life.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
