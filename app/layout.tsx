import "./globals.css";

export const metadata = {
  title: "Ivy Homes",
  description: "Ivy Homes property explorer"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}