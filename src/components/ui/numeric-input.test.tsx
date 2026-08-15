import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { NumericInput } from "./numeric-input";

function NumericInputHarness({ initialValue = 20 }: { initialValue?: number }) {
  const [value, setValue] = useState(initialValue);

  return (
    <>
      <NumericInput aria-label="Range value" value={value} onChange={setValue} allowNegative />
      <output aria-label="Domain value">{value}</output>
    </>
  );
}

describe("NumericInput", () => {
  it("uses a text input and allows clearing every digit before retyping", () => {
    render(<NumericInputHarness />);
    const input = screen.getByRole("textbox", { name: "Range value" });

    expect(input).toHaveAttribute("type", "text");
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue("");
    expect(screen.getByLabelText("Domain value")).toHaveTextContent("20");

    fireEvent.change(input, { target: { value: "-" } });
    expect(input).toHaveValue("-");
    fireEvent.change(input, { target: { value: "-7" } });
    expect(input).toHaveValue("-7");
    expect(screen.getByLabelText("Domain value")).toHaveTextContent("-7");
  });

  it("restores the safe fallback when left empty", () => {
    const onChange = vi.fn();
    render(<NumericInput aria-label="Range value" value={20} onChange={onChange} allowNegative />);
    const input = screen.getByRole("textbox", { name: "Range value" });

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(input).toHaveValue("0");
    expect(onChange).toHaveBeenLastCalledWith(0);
  });
});
