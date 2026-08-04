import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
});

export function parseMarkdown(text: string): string {
  return md.render(text);
}

export default parseMarkdown;

