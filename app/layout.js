import './globals.css'

export const metadata = {
  title: 'Ainek | Virtual Try-On',
  description: 'AI-Powered Virtual Try-On Mirror',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
