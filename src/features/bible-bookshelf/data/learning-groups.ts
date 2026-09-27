import { BIBLE_BOOKS_BY_LANGUAGE } from "@/features/bible-books/data/bibleBooks.registry";
import type { BibleBook, BibleBookLanguage } from "@/features/bible-books/model/bible-books.types";

export type BibleBookshelfGroupId =
  | "law"
  | "history"
  | "poetry-wisdom"
  | "major-prophets"
  | "minor-prophets"
  | "gospels-acts"
  | "pauline-letters"
  | "general-letters-revelation"
  | "gospels-general-letters"
  | "pauline-letters-revelation";

export interface BibleBookshelfGroup {
  id: BibleBookshelfGroupId;
  translationKey: BibleBookshelfGroupId;
  startOrder: number;
  endOrder: number;
}

const SHARED_OLD_TESTAMENT_GROUPS: readonly BibleBookshelfGroup[] = [
  { id: "law", translationKey: "law", startOrder: 1, endOrder: 5 },
  { id: "history", translationKey: "history", startOrder: 6, endOrder: 17 },
  { id: "poetry-wisdom", translationKey: "poetry-wisdom", startOrder: 18, endOrder: 22 },
  { id: "major-prophets", translationKey: "major-prophets", startOrder: 23, endOrder: 27 },
  { id: "minor-prophets", translationKey: "minor-prophets", startOrder: 28, endOrder: 39 },
] as const;

const ENGLISH_GROUPS: readonly BibleBookshelfGroup[] = [
  ...SHARED_OLD_TESTAMENT_GROUPS,
  { id: "gospels-acts", translationKey: "gospels-acts", startOrder: 40, endOrder: 44 },
  { id: "pauline-letters", translationKey: "pauline-letters", startOrder: 45, endOrder: 57 },
  {
    id: "general-letters-revelation",
    translationKey: "general-letters-revelation",
    startOrder: 58,
    endOrder: 66,
  },
] as const;

const EASTERN_ORDER_GROUPS: readonly BibleBookshelfGroup[] = [
  ...SHARED_OLD_TESTAMENT_GROUPS,
  {
    id: "gospels-general-letters",
    translationKey: "gospels-general-letters",
    startOrder: 40,
    endOrder: 51,
  },
  {
    id: "pauline-letters-revelation",
    translationKey: "pauline-letters-revelation",
    startOrder: 52,
    endOrder: 66,
  },
] as const;

export function getBibleBookshelfGroups(language: BibleBookLanguage): readonly BibleBookshelfGroup[] {
  return language === "en" ? ENGLISH_GROUPS : EASTERN_ORDER_GROUPS;
}

export function getBibleBookshelfGroup(
  language: BibleBookLanguage,
  groupId: BibleBookshelfGroupId
): BibleBookshelfGroup {
  return (
    getBibleBookshelfGroups(language).find((group) => group.id === groupId) ?? getBibleBookshelfGroups(language)[0]
  );
}

export function getBibleBookshelfGroupBooks(language: BibleBookLanguage, groupId: BibleBookshelfGroupId): BibleBook[] {
  const group = getBibleBookshelfGroup(language, groupId);

  return [...BIBLE_BOOKS_BY_LANGUAGE[language]]
    .sort((left, right) => left.order - right.order)
    .filter((book) => book.order >= group.startOrder && book.order <= group.endOrder);
}
