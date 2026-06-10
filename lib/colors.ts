import type { NotionColor } from "@/lib/types";

export const notionColorToPinHex: Record<NotionColor, { dark: string; light: string }> = {
  default: { dark: "#8A8F98", light: "#787774" },
  gray: { dark: "#8A8F98", light: "#787774" },
  brown: { dark: "#BA856F", light: "#9F6B53" },
  orange: { dark: "#D9730D", light: "#D9730D" },
  yellow: { dark: "#DFAB01", light: "#CB912F" },
  green: { dark: "#4DAB9A", light: "#448361" },
  blue: { dark: "#529CCA", light: "#337EA9" },
  purple: { dark: "#9A6DD7", light: "#9065B0" },
  pink: { dark: "#E255A1", light: "#C14C8A" },
  red: { dark: "#FF7369", light: "#D44C47" },
};

export function pinColor(color: NotionColor | undefined, theme: "dark" | "light" = "dark") {
  return notionColorToPinHex[color ?? "default"][theme];
}
