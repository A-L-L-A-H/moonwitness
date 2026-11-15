import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-brush text-5xl text-[var(--pink)]">SIGNAL LOST</h1>
      <p className="text-sm text-zinc-400">This frequency doesn&apos;t exist in the archive.</p>
      <Link
        href="/"
        className="mt-4 inline-flex min-h-11 items-center rounded-md bg-[var(--pink)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
      >
        RETURN TO BASE
      </Link>
    </main>
  );
}
