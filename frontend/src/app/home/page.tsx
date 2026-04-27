import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-card-bg px-6 text-center">
      <h1 className="text-2xl font-semibold text-text-main">Home</h1>
      <Link
        href="/login"
        className="text-sm font-medium text-primary dark:text-emerald-500 underline-offset-4 hover:underline"
      >
        Go to login
      </Link>
    </div>
  );
}
