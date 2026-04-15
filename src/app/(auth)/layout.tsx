import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LinkForex",
  description: "Sign in to LinkForex",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
