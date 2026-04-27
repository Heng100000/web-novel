import type { Metadata } from "next";
import { DashboardShell } from "./_components/dashboard-shell";
import { AuthGuard } from "./_components/auth-guard";

export const metadata: Metadata = {
  title: "ផ្ទាំងគ្រប់គ្រងអ្នកគ្រប់គ្រង | បណ្ណាល័យយើង",
  description: "គ្រប់គ្រងសៀវភៅរឿង សារពើភ័ណ្ឌ និងអតិថិជនរបស់អ្នក។",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <DashboardShell>
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
