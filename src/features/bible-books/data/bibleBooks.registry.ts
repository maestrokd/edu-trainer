import { BIBLE_BOOKS } from "./bibleBooks";
import { RUSSIAN_BIBLE_BOOKS } from "./bibleBooks.ru";
import { UKRAINIAN_BIBLE_BOOKS } from "./bibleBooks.uk";
import type { BibleBook, BibleBookLanguage } from "../model/bible-books.types";

export const BIBLE_BOOKS_BY_LANGUAGE: Readonly<Record<BibleBookLanguage, readonly BibleBook[]>> = {
  en: BIBLE_BOOKS,
  uk: UKRAINIAN_BIBLE_BOOKS,
  ru: RUSSIAN_BIBLE_BOOKS,
};

export function resolveBibleBookLanguage(locale: string | null | undefined): BibleBookLanguage {
  const language = locale?.toLowerCase().split("-")[0];
  return language === "uk" || language === "ru" ? language : "en";
}
