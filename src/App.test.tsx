import { render, screen } from "@testing-library/react";
import App from "./App";
import { beforeEach, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "./i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

it("shows Home link", () => {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  expect(screen.getByText("All")).toBeInTheDocument();
});

it("shows the public Bible Bookshelf route without authentication", () => {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/bible-bookshelf"]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  expect(screen.getByRole("heading", { name: "Set up your bookshelf", level: 1 })).toBeInTheDocument();
});
