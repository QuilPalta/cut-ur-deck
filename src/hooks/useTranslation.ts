import es from "@/dictionaries/es.json";
import en from "@/dictionaries/en.json";
import pt from "@/dictionaries/pt.json";

export type Language = "es" | "en" | "pt";

const dictionaries = {
  es,
  en,
  pt,
};

export function useTranslation(lang: Language) {
  return dictionaries[lang];
}