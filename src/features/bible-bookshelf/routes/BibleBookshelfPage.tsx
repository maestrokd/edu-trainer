import { usePageTitle } from "@/hooks/usePageTitle";

import { BibleBookshelfGame } from "../components/BibleBookshelfGame";

export function BibleBookshelfPage() {
  usePageTitle("bibleBookshelf.pageTitle");
  return <BibleBookshelfGame />;
}
