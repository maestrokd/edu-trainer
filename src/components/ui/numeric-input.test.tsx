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

  it("allows signed decimal replacement without committing transient input", () => {
    const onChange = vi.fn();
    render(
      <NumericInput
        aria-label="Decimal range value"
        value={12.5}
        onChange={onChange}
        allowNegative
        allowDecimal
      />
    );
    const input = screen.getByRole("textbox", { name: "Decimal range value" });

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "-." } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "-.5" } });
    expect(input).toHaveValue("-.5");
    expect(onChange).toHaveBeenLastCalledWith(-0.5);
  });

  it("clamps typed and fallback values to the configured bounds", () => {
    const onChange = vi.fn();
    render(
      <NumericInput aria-label="Weight" value={50} onChange={onChange} min={10} max={100} fallbackValue={5} />
    );
    const input = screen.getByRole("textbox", { name: "Weight" });

    fireEvent.change(input, { target: { value: "150" } });
    expect(onChange).toHaveBeenLastCalledWith(100);

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(input).toHaveValue("10");
    expect(onChange).toHaveBeenLastCalledWith(10);
  });

  it("uses the infinity placeholder only for zero-as-unlimited fields", () => {
    const onChange = vi.fn();
    render(
      <NumericInput
        aria-label="Timer"
        value={0}
        onChange={onChange}
        fallbackValue={0}
        showInfinityWhenZero
      />
    );
    const input = screen.getByRole("textbox", { name: "Timer" });

    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "∞");
    fireEvent.change(input, { target: { value: "5" } });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });
});
