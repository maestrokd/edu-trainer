import { usePageTitle } from "@/hooks/usePageTitle";

import { BibleBooksGame } from "../components/BibleBooksGame";

export function BibleBooksPage() {
  usePageTitle("bibleBooksGame.pageTitle");

  return <BibleBooksGame />;
}
