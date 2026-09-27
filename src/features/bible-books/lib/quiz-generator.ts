import { BIBLE_BOOKS_BY_LANGUAGE } from "../data/bibleBooks.registry";
import type {
  BibleBook,
  BibleBookLanguage,
  BibleBooksQuestion,
  BibleBookTransition,
  PracticeSetId,
} from "../model/bible-books.types";

const NORMAL_ROUND_SIZE = 10;

function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

export function getBooksForPracticeSet(
  practiceSet: PracticeSetId,
  bibleBookLanguage: BibleBookLanguage = "en"
): BibleBook[] {
  const books = [...BIBLE_BOOKS_BY_LANGUAGE[bibleBookLanguage]].sort((left, right) => left.order - right.order);

  switch (practiceSet) {
    case "FIRST_FIVE":
      return books.filter((book) => book.order <= 5);
    case "OLD_TESTAMENT":
      return books.filter((book) => book.testament === "OLD");
    case "NEW_TESTAMENT":
      return books.filter((book) => book.testament === "NEW");
    case "ALL_BOOKS":
      return books;
  }
}

export function getTransitionsForPracticeSet(
  practiceSet: PracticeSetId,
  bibleBookLanguage: BibleBookLanguage = "en"
): BibleBookTransition[] {
  const books = getBooksForPracticeSet(practiceSet, bibleBookLanguage);

  return books.slice(0, -1).map((currentBook, index) => ({
    currentBook,
    correctNextBook: books[index + 1],
  }));
}

function createAnswerOptions(
  transition: BibleBookTransition,
  practiceBooks: readonly BibleBook[],
  random: () => number
): BibleBook[] {
  const nearbyBooks = shuffled(
    practiceBooks.filter((book) => book.id !== transition.correctNextBook.id && book.id !== transition.currentBook.id),
    random
  ).sort(
    (left, right) =>
      Math.abs(left.order - transition.correctNextBook.order) - Math.abs(right.order - transition.correctNextBook.order)
  );

  return shuffled([transition.correctNextBook, ...nearbyBooks.slice(0, 2)], random);
}

export function generateBibleBooksRound(
  practiceSet: PracticeSetId,
  bibleBookLanguage: BibleBookLanguage = "en",
  random: () => number = Math.random
): BibleBooksQuestion[] {
  const practiceBooks = getBooksForPracticeSet(practiceSet, bibleBookLanguage);
  const transitions = getTransitionsForPracticeSet(practiceSet, bibleBookLanguage);
  const roundSize = practiceSet === "FIRST_FIVE" ? transitions.length : NORMAL_ROUND_SIZE;

  return shuffled(transitions, random)
    .slice(0, Math.min(roundSize, transitions.length))
    .map((transition) => ({
      ...transition,
      answerOptions: createAnswerOptions(transition, practiceBooks, random),
    }));
}
