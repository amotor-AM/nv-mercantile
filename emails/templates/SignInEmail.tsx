import * as React from "react"

export default function SignInEmail({ url }: { url: string }) {
  return (
    <div style={{ fontFamily: "Inter, Arial, sans-serif", color: "#111", padding: "24px" }}>
      <h1 style={{ fontSize: "20px", margin: "0 0 8px" }}>Sign in to NV Mercantile</h1>
      <p style={{ margin: "0 0 16px" }}>Click the secure button below to sign in.</p>
      <p>
        <a
          href={url}
          style={{
            background: "#111",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "6px",
            textDecoration: "none",
            display: "inline-block",
            fontWeight: 600,
          }}
        >
          Sign In
        </a>
      </p>
      <p style={{ color: "#666", fontSize: "12px" }}>
        If you did not request this link, you can ignore this email.
      </p>
    </div>
  )
}