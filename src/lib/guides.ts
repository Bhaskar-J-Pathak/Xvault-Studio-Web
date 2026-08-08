import fs from "fs";
import path from "path";
import matter from "gray-matter";

const GUIDES_DIR = path.join(process.cwd(), "content/guides");

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  genre: string;       // e.g. "Fantasy", "Mystery", "General"
  readTime: number;
  date: string;
}

export interface Guide extends GuideMeta {
  content: string;
}

export function getAllGuides(): GuideMeta[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];

  return fs
    .readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(GUIDES_DIR, file), "utf-8");
      const { data } = matter(raw);
      return {
        slug,
        title:       data.title       ?? "",
        description: data.description ?? "",
        genre:       data.genre        ?? "General",
        readTime:    (data.readTime as number) ?? 8,
        date:        data.date         ?? "",
      } satisfies GuideMeta;
    })
    .sort((a, b) => a.genre.localeCompare(b.genre));
}

export function getGuideBySlug(slug: string): Guide | null {
  const filePath = path.join(GUIDES_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title:       data.title       ?? "",
    description: data.description ?? "",
    genre:       data.genre        ?? "General",
    readTime:    (data.readTime as number) ?? 8,
    date:        data.date         ?? "",
    content,
  };
}
