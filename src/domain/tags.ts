export const CATEGORY_COLORS = ['#d6644a', '#4d7c68', '#7c6faf', '#c0923e', '#467493'];

const TAG_PATTERN = /(^|\s)#([\p{L}\p{N}_-]+)/u;
/** `//` after whitespace (or at the start) begins the hint, so URLs like `https://` are left alone. */
const HINT_PATTERN = /(^|\s)\/\/\s*/;
export const HINT_MAX_LENGTH = 140;

export interface ParsedTaskInput {
  title: string;
  /** Title with any `#tag` left in place, for when the tag cannot become a category. */
  titleWithTag: string;
  tag?: string;
  hint?: string;
  hintWithTag?: string;
}

function tidy(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeHint(raw: string): string | undefined {
  const hint = tidy(raw).slice(0, HINT_MAX_LENGTH);
  return hint || undefined;
}

function extractTag(text: string): { text: string; tag?: string } {
  const match = text.match(TAG_PATTERN);
  if (!match || match.index === undefined) return { text: tidy(text) };
  return { text: tidy(`${text.slice(0, match.index)}${match[1]}${text.slice(match.index + match[0].length)}`), tag: match[2] };
}

/** Split `title // hint` and pull the first `#tag` (from the title, else the hint); the tag becomes the category name. */
export function parseTaskInput(raw: string): ParsedTaskInput {
  const separator = raw.match(HINT_PATTERN);
  const titlePart = separator?.index === undefined ? raw : raw.slice(0, separator.index);
  const hintPart = separator?.index === undefined ? '' : raw.slice(separator.index + separator[0].length);

  const fromTitle = extractTag(titlePart);
  const fromHint = fromTitle.tag ? { text: tidy(hintPart) } : extractTag(hintPart);
  return {
    title: fromTitle.text,
    titleWithTag: tidy(titlePart),
    tag: fromTitle.tag ?? fromHint.tag,
    hint: normalizeHint(fromTitle.tag || !fromHint.tag ? hintPart : fromHint.text),
    hintWithTag: normalizeHint(hintPart),
  };
}
