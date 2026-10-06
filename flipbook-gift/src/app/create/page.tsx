import { Suspense } from "react";
import type { Metadata } from "next";
import CreateScreen from "../../components/CreateScreen";

export const metadata: Metadata = { title: "Make your gift", robots: { index: false } };

export default function CreatePage() {
  return <Suspense fallback={null}><CreateScreen /></Suspense>;
}
