// Recipient page (task 5.2): /g/<private token>. Never indexed; the token is the only way in.
import type { Metadata } from "next";
import GiftView from "../../../components/GiftView";

export const metadata: Metadata = {
  title: "A gift for you",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function GiftPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GiftView token={token} />;
}
