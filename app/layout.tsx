import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Passphrase Messages",
  description:
    "Send a message and get a passphrase, then retrieve it later using that passphrase.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
