import type { Metadata } from "next";
import "./globals.css";
import { SkipLink } from "@/components/shell/SkipLink";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "ProofSetu: application-readiness assistant",
    template: "%s · ProofSetu",
  },
  description:
    "From scattered documents to a review-ready housing packet. ProofSetu prepares; you confirm; a qualified housing professional decides.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* First focusable element for keyboard and screen-reader users. */}
        <SkipLink />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
