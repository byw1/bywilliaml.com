import type { Metadata, Viewport } from "next"
import { DateFlow } from "./date-flow"

const title = "will you go on a date with me?"
const description = "two buttons. one of them works."

export const metadata: Metadata = {
  metadataBase: new URL("https://bywilliaml.com"),
  title,
  description,
  openGraph: { title, description, url: "/date", type: "website" },
  twitter: { card: "summary_large_image", title, description },
  // It's an invitation, not a landing page.
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#ffe4ea",
}

export default function DatePage() {
  return <DateFlow />
}
