import { render, screen } from "@testing-library/react";
import App from "./App";
import { expect, it } from "vitest";
import { MemoryRouter } from "react-router";

it("shows Home link", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByText("Home Page")).toBeInTheDocument();
});
