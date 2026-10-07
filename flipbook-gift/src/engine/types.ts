// Public types for the flipbook engine. Pure TypeScript: no React, DB or Cloudinary imports.

export type Pt = [number, number];

/** Which vertical corner of the page edge the finger grabbed. */
export type CornerSide = "top" | "bottom";

/** +1 = turning forward (grab right edge), -1 = turning back (grab left edge). */
export type Direction = 1 | -1;

/** A page is a ready bitmap/canvas, or a function that paints into a w x h (CSS px) context. */
export type PageDrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number, index: number) => void;
export type PageSource = CanvasImageSource | PageDrawFn;

export interface FlipbookOptions {
  /** Pages to show. Entries may be promises or not-yet-loaded images: the engine shows a loading state until all are ready. */
  pages: Array<PageSource | Promise<PageSource>>;
  /**
   * "width" (default): the book is as wide as its container and as tall as the aspect ratio needs.
   * "contain": the book is the largest page that fits inside the container's width and height
   * (the container needs a definite height; otherwise it falls back to "width").
   */
  fit?: "width" | "contain";
  /** Discreet previous/next arrow buttons. Default true. */
  buttons?: boolean;
  /** Left/right arrow keys turn pages. Default true. */
  keyboard?: boolean;
  loadingText?: string;
  errorText?: string;
  retryText?: string;
  /** If set, the error state shows a retry button that calls this (for example to reload the gift). */
  onRetry?: () => void;
  onError?: (error: unknown) => void;
  /** Page aspect ratio, width / height. Default 3 / 4. */
  aspect?: number;
  /** Colour of the reverse side of the paper. Default warm off-white. */
  backColor?: string;
  /** How strongly the front shows through on the reverse side, 0 to 1. Default 0.14. */
  showThrough?: number;
  /** Cap on devicePixelRatio. Default 3. */
  maxPixelRatio?: number;
  onPageChange?: (index: number) => void;
}

export interface Flipbook {
  /** Animate to the next page. Resolves true if the page turned. */
  next(): Promise<boolean>;
  /** Animate to the previous page. Resolves true if the page turned. */
  prev(): Promise<boolean>;
  /**
   * Low-level: show the fold for a corner dragged to (x, y), in CSS px relative to the page.
   * Pointer handling (task 1.3) calls this; clearFold() removes it.
   */
  setFold(dir: Direction, side: CornerSide, x: number, y: number): void;
  clearFold(): void;
  /**
   * Live-tunable feel. `completeFraction`: a released drag completes the turn once the corner has
   * travelled this fraction of the page width (default 0.38).
   */
  readonly tuning: { completeFraction: number };
  /** Re-measure the container and redraw. Resizing is also detected automatically. */
  resize(): void;
  /** Resolves true once every page is loaded and drawn, false if loading or drawing failed. */
  readonly ready: Promise<boolean>;
  readonly state: "loading" | "ready" | "error";
  readonly index: number;
  readonly pageCount: number;
  destroy(): void;
}

/** Everything needed to draw one frame of a folded page. */
export interface FoldGeometry {
  /** Midpoint between the grabbed corner and the finger; a point on the fold line. */
  mid: Pt;
  /** Unit vector perpendicular to the fold line, pointing from the finger toward the corner. */
  normal: Pt;
  /** Part of the page that has been lifted (corner side of the fold line). */
  liftedPoly: Pt[];
  /** Part of the page still lying flat (front side visible). */
  flatPoly: Pt[];
  /** The lifted part mirrored across the fold line: where the reverse side appears. */
  backPoly: Pt[];
  /** Canvas transform [a, b, c, d, e, f] that mirrors page content across the fold line. */
  mirror: [number, number, number, number, number, number];
}
