export type BibleTestament = "OLD" | "NEW";

export type BibleSection =
  | "LAW"
  | "HISTORY"
  | "POETRY_WISDOM"
  | "MAJOR_PROPHETS"
  | "MINOR_PROPHETS"
  | "GOSPELS"
  | "NEW_TESTAMENT_HISTORY"
  | "PAULINE_EPISTLES"
  | "GENERAL_EPISTLES"
  | "PROPHECY";

export interface BibleBook {
  id: string;
  name: string;
  order: number;
  testament: BibleTestament;
  section: BibleSection;
}

export type BibleBookLanguage = "en" | "uk" | "ru";

export type PracticeSetId = "FIRST_FIVE" | "OLD_TESTAMENT" | "NEW_TESTAMENT" | "ALL_BOOKS";

export interface BibleBookTransition {
  currentBook: BibleBook;
  correctNextBook: BibleBook;
}

export interface BibleBooksQuestion extends BibleBookTransition {
  answerOptions: BibleBook[];
}
