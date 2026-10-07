// Recipient page (task 5.2): /g/<private token>. Never indexed; the token is the only way in.
import type { Metadata } from "next";
import GiftView from "../../../components/GiftView";
import { pgStore } from "../../../server/pg";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const gift = await pgStore.byPrivateToken(token);
  const recipient = gift?.recipientName?.trim() || "you";
  const title = `A gift for ${recipient}`;
  const description = "A special digital gift from NatraGift. Open it to see your surprise.";

  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true },
    referrer: "no-referrer",
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: `/g/${token}/opengraph-image`, width: 1200, height: 630, alt: "A wrapped digital gift from NatraGift" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/g/${token}/opengraph-image`],
    },
  };
}

export default async function GiftPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GiftView token={token} />;
}
