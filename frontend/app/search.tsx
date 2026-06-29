import { Fragment, type ReactNode } from "react";

export function matchesSearch(values: unknown[], search: string) {
  const words = search.trim().toLocaleLowerCase("es").split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const content = values.filter((value) => value !== null && value !== undefined).join(" ").toLocaleLowerCase("es");
  return words.every((word) => content.includes(word));
}

export function Highlight({ children, search }: { children: unknown; search: string }): ReactNode {
  const text = String(children ?? "");
  const words = Array.from(new Set(search.trim().split(/\s+/).filter(Boolean))).sort((a, b) => b.length - a.length);
  if (words.length === 0) return text;
  const expression = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  return text.split(expression).map((part, index) =>
    words.some((word) => word.toLocaleLowerCase("es") === part.toLocaleLowerCase("es"))
      ? <mark key={`${part}-${index}`}>{part}</mark>
      : <Fragment key={`${part}-${index}`}>{part}</Fragment>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
