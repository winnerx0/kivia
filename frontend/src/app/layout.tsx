/**
 * The application shell now lives in src/main.tsx. This component remains as
 * a small reusable wrapper for code that imported the former root layout.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
