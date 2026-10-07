// Recipient page (task 5.2): /g/<private token>. Never indexed; the token is the only way in.
import type { Metadata } from "next";
import GiftView from "../../../components/GiftView";

export const dynamic = "force-dynamic";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://natratech.pro.et").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const title = "A gift for you";
  const description = "A special digital gift from NatraGift. Open it to see your surprise.";
  const previewImage = `${siteUrl}/g/${token}/opengraph-image`;
  const giftUrl = `${siteUrl}/g/${token}`;

  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true },
    referrer: "no-referrer",
    openGraph: {
      title,
      description,
      type: "website",
      url: giftUrl,
      siteName: "NatraGift",
      images: [{
        url: previewImage,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "A wrapped digital gift from NatraGift",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [previewImage],
    },
  };
}

export default async function GiftPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GiftView token={token} />;
}
