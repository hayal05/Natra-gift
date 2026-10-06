// Slot-based layout model (task 2.1). Pure TypeScript, no React/DB imports: reused by the editor,
// the recipient page and the offline export. Layouts are DATA; one generic renderer draws any of them.
// All geometry is in fractions of the page: x and w of page width, y and h of page height.

/** Theme colours. Layouts and user overrides refer to these by name so a palette swap restyles the book. */
export interface Palette {
  paper: string; // default page background
  ink: string; // main text
  accent: string;
  accent2: string;
  soft: string; // light tint for panels
  dark: string; // dark page background
}
export type ColorRef = keyof Palette | (string & {}); // palette key, or a literal CSS colour (#fff, rgba(...))

/** Theme fonts: one display face and one body face (CSS font-family strings). */
export interface FontPair {
  display: string;
  body: string;
  /** Heaviest real weight of the display face. Heavier requests are capped to it, so the browser never fakes a bold that is wider than measured. */
  displayMaxWeight?: number;
}
export type FontRole = "display" | "body";

export interface BookStyle {
  palette: Palette;
  fonts: FontPair;
  /** Shown in the auto folio line, e.g. "OUR STORY". */
  masthead: string;
}

export type SizeStep = "S" | "M" | "L";
export type Align = "left" | "center" | "right";
export type PhotoFit = "fill" | "fit";
export type PhotoFilter = "none" | "warm" | "bw";
export type PhotoFrame = "none" | "border" | "rounded";

/** Rotation about a pivot given in page fractions, so several slots can turn together (a polaroid and its caption). */
export interface Rot {
  deg: number;
  cx: number;
  cy: number;
}

interface SlotBase {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: Rot;
}

export interface TextSlotDef extends SlotBase {
  kind: "text";
  font: FontRole;
  /** Base font size as a fraction of page width (before the S/M/L step). */
  size: number;
  weight?: number;
  italic?: boolean;
  upper?: boolean;
  /** Extra letter spacing in em. */
  tracking?: number;
  /** Line height multiplier. Default 1.3. */
  lh?: number;
  align?: Align;
  valign?: "top" | "middle" | "bottom";
  color: ColorRef;
  /** "folio" draws the page number and masthead; the slot needs no content. */
  auto?: "folio";
  /** Fixed decorative text (for example a big quote mark); the slot is not editable. */
  text?: string;
  /** Shown while the creator has not written anything (editor hint, never rendered into the final book). */
  hint?: string;
}

export interface PhotoSlotDef extends SlotBase {
  kind: "photo";
  frame?: PhotoFrame;
  /** Extra white mat under the picture, as a fraction of the slot height (polaroid look). Only with the border frame. */
  matBottom?: number;
  shadow?: boolean;
}

export interface ShapeSlotDef extends SlotBase {
  kind: "shape";
  shape: "rect" | "ellipse" | "line" | "scrim-down" | "scrim-up";
  fill: ColorRef;
  alpha?: number;
  shadow?: boolean;
}

export type SlotDef = TextSlotDef | PhotoSlotDef | ShapeSlotDef;

export type LayoutGroup = "cover" | "photo" | "collage" | "text" | "quote" | "closing";

export interface Layout {
  id: string;
  name: string;
  /** For the layout picker. */
  group: LayoutGroup;
  /** Default background; a page may override it. */
  bg: ColorRef;
  slots: SlotDef[];
}

/** What a photo slot holds. `src` is a URL or data URI; empty means "not chosen yet" (a placeholder is drawn). */
export interface PhotoContent {
  src: string;
  /** Pan, -1 to 1 on each axis, 0 = centred. Only has an effect when the photo overflows the slot. */
  panX?: number;
  panY?: number;
  /** 1 to 3. */
  zoom?: number;
  fit?: PhotoFit;
  filter?: PhotoFilter;
  frame?: PhotoFrame;
}

/** Creator overrides for a text slot, all chosen from presets. */
export interface TextStyle {
  font?: FontRole;
  size?: SizeStep;
  align?: Align;
  color?: ColorRef;
}

/** One page of a gift, exactly as stored in the gifts.content JSON. */
export interface PageData {
  layout: string;
  bg?: ColorRef;
  /** Text slots hold strings, photo slots hold PhotoContent. */
  slots: Record<string, string | PhotoContent>;
  styles?: Record<string, TextStyle>;
}

/** Decoded images by `src`. A missing entry draws the placeholder (still loading, or failed). */
export type ImageMap = Map<string, CanvasImageSource & { width?: number; height?: number }>;
