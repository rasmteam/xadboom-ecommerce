import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="relative pt-16 w-full px-gutter min-h-screen pb-12 bg-[#F7E9E3]">
      <div className="py-space-lg">
        <h1 className="font-headline-md text-headline-md text-primary tracking-tight font-medium">Overview</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Operations dashboard arrives with the orders part. Start from{" "}
          <Link className="underline" href="/admin/pieces">
            Pieces Catalog
          </Link>{" "}
          or{" "}
          <Link className="underline" href="/admin/settings">
            Settings
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
