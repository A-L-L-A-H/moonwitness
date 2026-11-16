export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#11110F', color: '#FFF' }}>{children}</body>
    </html>
  )
}

