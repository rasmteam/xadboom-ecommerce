"use client";

/** A GET form that re-submits whenever a select changes (search submits on Enter). */
export function AutoSubmitForm({
  children,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement> & { children: React.ReactNode }) {
  return (
    <form
      method="get"
      {...props}
      onChange={(e) => {
        if (e.target instanceof HTMLSelectElement) e.currentTarget.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
