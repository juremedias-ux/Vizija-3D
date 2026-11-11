"use client";

export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html lang="sl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0a0d10",
          color: "#ecf1f5",
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
        }}
      >
        <main>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>
            Prišlo je do napake.
          </h1>
          <p style={{ color: "#a7b3bf" }}>
            Strani trenutno ni bilo mogoče prikazati.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 48,
              padding: "0 1.5rem",
              border: 0,
              borderRadius: 6,
              background: "#38c8ff",
              color: "#02141c",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Poskusi znova
          </button>
        </main>
      </body>
    </html>
  );
}
