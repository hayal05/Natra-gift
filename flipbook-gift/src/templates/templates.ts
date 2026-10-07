// The 10 templates (task 2.3). Each is a theme (palette, two font pairs, masthead) plus 7 to 8 pages
// built from the layout library. Page 0 is the cover. {to} and {from} are filled in by instantiate().
// Text lengths are sized to the layouts' text boxes: keep edits near the same length (see layouts.ts).
import type { FontPair, PageData } from "../lib/pages/types";
import type { Template } from "./types";

// Font families are Google Fonts (all available as @fontsource npm packages, so they can be bundled and
// embedded in the offline export). Each stack ends in a safe system fallback.
const serif = "Georgia, 'Times New Roman', serif";
const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
// maxWeight = heaviest weight the display face really has (see FontPair.displayMaxWeight).
const fp = (display: string, body: string, maxWeight?: number): FontPair =>
  ({ display: `'${display}', ${serif}`, body: `'${body}', ${sans}`, ...(maxWeight ? { displayMaxWeight: maxWeight } : {}) });
const ALT = {
  classic: fp("Libre Baskerville", "Open Sans", 700),
  modern: fp("Space Grotesk", "Inter", 700),
};

const ph = (n: number, o: object = {}) => ({ src: `sample:${n}`, ...o });
const pg = (layout: string, slots: PageData["slots"], bg?: string): PageData => (bg ? { layout, slots, bg } : { layout, slots });

export const TEMPLATE_LIST: Template[] = [
  {
    id: "love-story", name: "Love Story", blurb: "A refined love editorial — intimate, cinematic, and made for two.",
    masthead: "OUR STORY",
    palette: { paper: "#fff8f6", ink: "#24171b", accent: "#9f3150", accent2: "#ef9bb0", soft: "#f9e1e4", dark: "#28121b" },
    fontPairs: [fp("Playfair Display", "Lato"), ALT.classic],
    invitation: "{from} made something just for you, {to}. Open it when you have a quiet moment.",
    pages: [
      pg("love-editorial", { p1: ph(1), title: "Our Story", kicker: "The Love Issue · No. 1", body: "10 reasons I love you · The day everything changed", byline: "For {to}" }),
      pg("letter", { p1: ph(2), kicker: "Editor's letter", title: "Dear {to},", body: "I never planned for you. Then you laughed at my worst joke, and my whole year rearranged itself around that sound. This little magazine is my way of saying thank you for every ordinary Tuesday that felt like a holiday.", sign: "{from}" }),
      pg("photo-full", { p1: ph(3), kicker: "Moment", caption: "The afternoon we stopped pretending it was just coffee." }),
      pg("polaroid-two", { p1: ph(1), caption: "First date", p2: ph(4), caption2: "Still laughing" }),
      pg("quote-big", { quote: "Home is wherever you are laughing.", byline: "{from} to {to}", p1: ph(5) }),
      pg("list", { title: "10 reasons", p1: ph(2), kicker: "A short list", body: "1. Your terrible, wonderful jokes\n2. The way you hum while cooking\n3. You remember everything\n4. You make waiting feel easy\n5. Your hand in mine\n6. Home" }),
      pg("closing", { p1: ph(6), title: "Forever, please", body: "Thank you for being my favorite person.", sign: "{from}" }),
    ],
  },
  {
    id: "anniversary", name: "Anniversary", blurb: "A timeless anniversary keepsake built around chapters, milestones, and the years ahead.",
    masthead: "ALWAYS US",
    palette: { paper: "#faf6ef", ink: "#241b1b", accent: "#7a2433", accent2: "#c9a45b", soft: "#eee2cf", dark: "#241015" },
    fontPairs: [fp("Cormorant Garamond", "Montserrat", 700), ALT.modern],
    invitation: "Happy anniversary, {to}. {from} has been saving this one for you.",
    pages: [
      pg("cover-frame", { kicker: "The Anniversary Edition", title: "Always Us", p1: ph(1), body: "Every year, a new favorite chapter\nThe things we kept", byline: "For {to}" }),
      pg("chapter-number", { p1: ph(2), kicker: "Chapter 01 · The beginning", title: "01", body: "A crowded room, one shy hello, and a feeling I still can't explain.", caption: "Where it all began" }),
      pg("collage-3", { p1: ph(3), p2: ph(4), p3: ph(5), caption: "A few of the places we've been brave together." }),
      pg("letter-corner", { p1: ph(6), kicker: "A letter", title: "Through every season", body: "Some years were easy and some years were hard, and in every one of them you were the person I wanted to tell first. Thank you for choosing me again and again, on the loud days and the quiet ones. I would choose you in every version of the story.", sign: "{from}" }),
      pg("photo-framed", { p1: ph(2), kicker: "Our favorite", caption: "The night we danced in the kitchen." }),
      pg("two-column", { title: "What we've learned", p1: ph(4), body: "Say it out loud. Laugh at the small things. Never go to sleep angry, or at least hold hands while you are.", body2: "Make room for each other's quiet. Keep showing up. Stay curious about who we are becoming." }),
      pg("quote-photo", { p1: ph(1), quote: "Here's to us, and all the years still waiting.", byline: "{from}" }),
      pg("closing-dark", { p1: ph(5), title: "Happy anniversary", body: "Here's to the next chapter, together.", sign: "{from}" }),
    ],
  },
  {
    id: "wedding", name: "Wedding", blurb: "A modern wedding keepsake with invitation-like elegance and quiet botanical warmth.",
    masthead: "THE WEDDING",
    palette: { paper: "#fdfcf8", ink: "#34362f", accent: "#5f705b", accent2: "#cbb894", soft: "#edf0e7", dark: "#2d352d" },
    fontPairs: [fp("Italiana", "Jost", 400), ALT.classic],
    invitation: "{from} has a gift for you on your wedding day, {to}. Open it and smile.",
    pages: [
      pg("wedding-invite", { p1: ph(1), kicker: "The Wedding Edition", title: "Forever Begins", byline: "For {to}", body: "Vows, laughter, and everyone we love" }),
      pg("letter", { p1: ph(2), kicker: "A note for the day", title: "Dear {to},", body: "Today two people I love become one wonderful story, and I am so happy to watch it begin. May your home always be full of laughter, good food, and open doors.", sign: "{from}" }),
      pg("photo-framed", { p1: ph(3), kicker: "The proposal", caption: "A yes that was never in doubt." }),
      pg("polaroid-one", { p1: ph(4), caption: "Getting ready", kicker: "The morning of" }),
      pg("split-side", { p1: ph(5), kicker: "The vows", title: "In sickness and in health", body: "Promises made softly in front of everyone who matters. Read them again whenever you need to remember why." }),
      pg("collage-2-side", { p1: ph(6), p2: ph(2), title: "The celebration", caption: "Dancing, toasts, and cake for breakfast the next day." }),
      pg("quote-big", { quote: "Two people, one adventure, and a great deal of cake.", byline: "Wishing you joy", p1: ph(3) }),
      pg("closing", { p1: ph(1), title: "Congratulations", body: "With all my love on your wedding day.", sign: "{from}" }),
    ],
  },
  {
    id: "best-friends", name: "Best Friends", blurb: "A modern friendship scrapbook — candid photos, inside jokes, and the stories only you share.",
    masthead: "BFF WEEKLY",
    palette: { paper: "#fffdf7", ink: "#17181b", accent: "#c7432f", accent2: "#f3c447", soft: "#fff0bd", dark: "#1b1b24" },
    fontPairs: [fp("Archivo Black", "DM Sans", 400), ALT.modern],
    invitation: "{from} has something for you, {to}. Warning: feelings ahead.",
    pages: [
      pg("friends-grid", { kicker: "The Friendship Edition", title: "BEST\nFRIENDS", p1: ph(1), p2: ph(2), p3: ph(3), p4: ph(4), p5: ph(5), byline: "FOR {to}" }),
      pg("collage-3-strip", { p1: ph(2), caption: "Road trip, wrong exit, best day", p2: ph(3), caption2: "Snacks at midnight", p3: ph(4), caption3: "The photo we both hate" }),
      pg("split-bottom", { kicker: "Breaking news", title: "You are my person", body: "Official report: no one else laughs at my jokes the way you do, and no one else gets the reference. Case closed.", p1: ph(5) }),
      pg("polaroid-two", { p1: ph(6), caption: "Day one", p2: ph(1), caption2: "Day one thousand" }),
      pg("list", { title: "Things only we get", p1: ph(2), kicker: "Inside jokes", body: "1. The thing with the umbrella\n2. \"Not again\"\n3. That one song\n4. Pancakes at 2 a.m.\n5. The look" }),
      pg("quote-photo", { p1: ph(4), quote: "Friends like you are the plot twist I never saw coming.", byline: "{from}" }),
      pg("letter-corner", { p1: ph(3), kicker: "Serious for a second", title: "Thank you", body: "Thanks for the shows you sat through, the secrets you kept, and the times you picked up the phone when you were tired. I'm better because you're in my corner. Don't tell anyone I got sentimental.", sign: "{from}" }),
      pg("closing-dark", { p1: ph(5), title: "Squad goals: us", body: "Call me when you see this.", sign: "{from}" }),
    ],
  },
  {
    id: "birthday", name: "Birthday Surprise", blurb: "A stylish birthday issue with bold type, joyful color, and one unforgettable year.",
    masthead: "THIS YEAR",
    palette: { paper: "#fffaf2", ink: "#261d3d", accent: "#7040c7", accent2: "#ff9b57", soft: "#eee5ff", dark: "#251a42" },
    fontPairs: [fp("Fredoka", "Nunito", 700), ALT.modern],
    invitation: "Surprise, {to}! {from} wrapped something up for your birthday.",
    pages: [
      pg("cover-bold", { kicker: "The Birthday Edition", title: "Surprise!", p1: ph(1), body: "Cake, confetti, and one very big year", byline: "For {to}" }),
      pg("birthday-number", { kicker: "The Birthday Edition", title: "YOUR\nDAY", p1: ph(2), body: "A whole year worth celebrating.", byline: "For {to}" }),
      pg("collage-3", { p1: ph(3), p2: ph(4), p3: ph(5), caption: "A year of adventures, one photo at a time." }),
      pg("letter", { p1: ph(6), kicker: "From me to you", title: "Dear {to},", body: "Another year older and somehow even more wonderful. I hope today is full of cake, laughter, and people who adore you. Make a big wish, and know that I'm cheering for every single one.", sign: "{from}" }),
      pg("list", { title: "Birthday wishes", p1: ph(1), kicker: "Your big year", body: "1. Cake for breakfast\n2. Zero worries\n3. Dancing in the kitchen\n4. Adventures big and small\n5. Everyone you love, close by" }),
      pg("quote-big", { quote: "Another year means another chance to be fabulous.", byline: "Birthday wisdom", p1: ph(2) }),
      pg("closing", { p1: ph(4), title: "Make a wish", body: "Blow out the candles. This year is yours.", sign: "{from}" }),
    ],
  },
  {
    id: "sorry", name: "I'm Sorry", blurb: "A quiet, honest letter for the words that deserve care, space, and sincerity.",
    masthead: "A FEW WORDS",
    palette: { paper: "#fafafa", ink: "#202833", accent: "#426c8d", accent2: "#a7c1d4", soft: "#e4edf3", dark: "#1d2935" },
    fontPairs: [fp("Lora", "Source Sans 3", 700), ALT.modern],
    invitation: "{from} has something to say to you, {to}. Take your time.",
    pages: [
      pg("cover-frame", { kicker: "A letter, not an excuse", title: "I'm Sorry", p1: ph(1), body: "What I should have said\nWhat I want to do next", byline: "For {to}" }),
      pg("quiet-apology", { p1: ph(2), kicker: "First, the truth", title: "{to},", body: "I hurt you, and I'm sorry. Not because things are awkward, but because you matter to me and I let you down. You deserved better from me, and I am going to do better.", sign: "{from}" }),
      pg("photo-framed", { p1: ph(3), kicker: "What I miss", caption: "Us, the way we were before I messed up." }),
      pg("split-top", { p1: ph(4), kicker: "What I understand now", title: "I should have listened", body: "I was thinking about myself when I should have been thinking about you." }),
      pg("two-column", { title: "What I'll do differently", p1: ph(5), body: "Listen first, then talk. Say what I feel before it turns into silence. Own it quickly when I'm wrong.", body2: "Show you with actions, not just words. Give you all the time you need. Keep trying, every day." }),
      pg("quote-photo", { p1: ph(6), quote: "No excuses. Just a heartfelt, honest sorry.", byline: "{from}" }),
      pg("closing", { p1: ph(2), title: "Whenever you're ready", body: "I'll be here, ready to listen and to make it right.", sign: "{from}" }),
    ],
  },
  {
    id: "memories", name: "Our Memories", blurb: "A tactile photo journal inspired by film prints, contact sheets, and imperfect memories.",
    masthead: "OUR MEMORIES",
    palette: { paper: "#f4eee4", ink: "#342920", accent: "#91502b", accent2: "#d2a06c", soft: "#e8dcc9", dark: "#2a1f18" },
    fontPairs: [fp("DM Serif Display", "Work Sans", 400), ALT.classic],
    invitation: "{from} collected some of your best days for you, {to}.",
    pages: [
      pg("cover-full", { p1: ph(1), title: "Our Memories", kicker: "The Keepsake Issue", body: "The little moments\nThe big ones too", byline: "For {to}" }),
      pg("polaroid-one", { p1: ph(2), caption: "That summer", kicker: "Remember when" }),
      pg("contact-sheet", { kicker: "Contact sheet · 06 frames", p1: ph(3), p2: ph(4), p3: ph(5), p4: ph(1), p5: ph(2), p6: ph(6), caption: "Mostly blurry, completely perfect." }),
      pg("photo-full", { p1: ph(5), kicker: "Favorite day", caption: "Sun on our faces and nowhere to be." }),
      pg("split-side", { p1: ph(6), kicker: "The story goes", title: "Wrong turn, best turn", body: "We were lost for an hour and laughed for all of it. Funny how the detours turn into the memories we tell most." }),
      pg("collage-2-side", { p1: ph(1), p2: ph(3), title: "Little things", caption: "Tickets, receipts, and inside jokes." }),
      pg("letter-corner", { p1: ph(4), kicker: "A note in the margin", title: "Keep this", body: "If you ever feel far from the good days, flip through these pages. We made all of this together, and there is more coming. I am so grateful for every moment with you.", sign: "{from}" }),
      pg("closing", { p1: ph(2), title: "To be continued", body: "Many more pages to fill.", sign: "{from}" }),
    ],
  },
  {
    id: "appreciation", name: "Appreciation", blurb: "A warm editorial thank-you designed to feel personal, thoughtful, and lasting.",
    masthead: "WITH GRATITUDE",
    palette: { paper: "#fbfaf4", ink: "#1f2d24", accent: "#2f6b4a", accent2: "#d1ad4c", soft: "#e6efe2", dark: "#14271c" },
    fontPairs: [fp("Libre Baskerville", "Open Sans", 700), ALT.modern],
    invitation: "{from} wants to say something to you, {to}. It's been a long time coming.",
    pages: [
      pg("cover-split", { p1: ph(1), kicker: "A thank-you edition", title: "Thank You", byline: "For {to}", body: "Small things that mean everything" }),
      pg("letter", { p1: ph(2), kicker: "Dear {to}", title: "I noticed", body: "I noticed how you show up when it matters, how you make time when you have none, how you make everyone around you feel capable. I don't say it enough, so here it is: thank you.", sign: "{from}" }),
      pg("list", { title: "Because of you", p1: ph(3), kicker: "Thank you for", body: "1. Always showing up\n2. Believing in me\n3. Making hard days lighter\n4. Your patience\n5. Being exactly you" }),
      pg("photo-rounded", { title: "You make a difference", p1: ph(4), caption: "People like you quietly change everything for the better." }),
      pg("collage-2-side", { p1: ph(5), p2: ph(6), title: "Moments I won't forget", caption: "Small kindnesses that stayed with me." }),
      pg("gratitude", { quote: "Your kindness didn't go unnoticed. It never does.", body: "From the small things to the moments that mattered most, you made a difference.", sign: "{from}", p1: ph(2) }),
      pg("closing-dark", { p1: ph(1), title: "With gratitude", body: "Thank you, truly, from the bottom of my heart.", sign: "{from}" }),
    ],
  },
  {
    id: "long-distance", name: "Long Distance", blurb: "A cinematic postcard from one place to another — distance, dates, and the promise of seeing each other again.",
    masthead: "CLOSER",
    palette: { paper: "#f5f8fc", ink: "#14223d", accent: "#315fc2", accent2: "#8caef0", soft: "#e0e9f8", dark: "#0f1c35" },
    fontPairs: [fp("Space Grotesk", "Inter", 700), ALT.classic],
    invitation: "{from} sent this across the miles, {to}. Open it and feel a little closer.",
    pages: [
      pg("cover-split", { p1: ph(1), kicker: "The Long-Distance Issue", title: "Closer", byline: "For {to}", body: "Same moon\nDifferent time zones" }),
      pg("letter", { p1: ph(2), kicker: "Across the miles", title: "Hi {to},", body: "Today I thought of you at least a hundred times. The distance is real, but so is this: you're the first person I want to tell everything. Every mile is just a reason to love you louder.", sign: "{from}" }),
      pg("route-postcard", { p1: ph(3), kicker: "Same sky · Different place", title: "Still under one sky", body: "Wherever you are, I'm looking at the same moon.", caption: "HERE  ·  THERE  ·  TOGETHER SOON" }),
      pg("split-bottom", { kicker: "Counting down", title: "Until I see you", body: "Every day crossed off is one day closer. I already know where I'm taking you first.", p1: ph(4) }),
      pg("collage-3", { p1: ph(5), p2: ph(6), p3: ph(2), caption: "The plan: all of this, together, soon." }),
      pg("quote-big", { quote: "Not goodbye, just see you soon.", byline: "{from} to {to}", p1: ph(1) }),
      pg("closing-dark", { p1: ph(3), title: "See you soon", body: "Until then, I'm right here.", sign: "{from}" }),
    ],
  },
  {
    id: "just-because", name: "Just Because", blurb: "A light, charming mini-editorial for the beautiful moments that need no occasion.",
    masthead: "JUST BECAUSE",
    palette: { paper: "#fff8f2", ink: "#2c2230", accent: "#a9473f", accent2: "#45bfa9", soft: "#ffe1d5", dark: "#20313a" },
    fontPairs: [fp("Abril Fatface", "Poppins", 400), ALT.classic],
    invitation: "No reason at all, {to}. {from} just wanted to make you smile.",
    pages: [
      pg("just-because", { kicker: "No occasion needed", title: "Just Because", p1: ph(1), body: "A little something to brighten your day", byline: "For {to}" }),
      pg("photo-rounded", { title: "Surprise!", p1: ph(2), caption: "No reason, no occasion. You just came to mind." }),
      pg("polaroid-two", { p1: ph(3), caption: "Good vibes", p2: ph(4), caption2: "More good vibes" }),
      pg("letter-corner", { p1: ph(5), kicker: "A small note", title: "Thinking of you", body: "I saw something today that made me think of you, so I made this. You don't need a special day to be celebrated. I'm just glad you exist, and I hope this makes you smile.", sign: "{from}" }),
      pg("collage-2", { kicker: "Little joys", p1: ph(6), p2: ph(1), caption: "The small stuff that makes life sweet." }),
      pg("quote-photo", { p1: ph(2), quote: "You are someone's favorite person today. Mine.", byline: "{from}" }),
      pg("closing", { p1: ph(4), title: "Smile, you're loved", body: "That's it. That's the whole gift.", sign: "{from}" }),
    ],
  },
];

export const TEMPLATES: Record<string, Template> = Object.fromEntries(TEMPLATE_LIST.map((t) => [t.id, t]));
