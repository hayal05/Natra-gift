// What the offline file carries (task 6.1): everything already resolved, so the file needs no templates or network.
import type { BookStyle, PageData } from "../lib/pages/types";

export interface OfflineGift {
  to: string;
  from: string;
  /** The envelope letter text. */
  message: string;
  style: BookStyle;
  /** Names already filled in; photos are sample:N or data: URIs only. */
  pages: PageData[];
}
