import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import { formatDecimal } from "../lib/decimal";
import { AnswerInput } from "../components/AnswerInput";
import { TaskCard } from "../components/TaskCard";
import type { TaskState } from "../model/trainer.types";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

const task: TaskState = {
  operation: "multiply",
  power: 3,
  notation: "power",
  numberType: "decimal",
  base: { coefficient: 1234, scale: 2 },
  left: { coefficient: 1234, scale: 2 },
  correctAnswer: { coefficient: 12340, scale: 0 },
  options: [
    { coefficient: 12340, scale: 0 },
    { coefficient: 1234, scale: 0 },
    { coefficient: 123400, scale: 0 },
    { coefficient: 1234, scale: 5 },
  ],
  taskId: 1,
};

describe("powers-of-ten play components", () => {
  it("renders accessible exponent notation and an optional place-value hint", () => {
    render(
      <TaskCard
        task={task}
        answerMode="quiz"
        showHint
        disabled={false}
        inputValue=""
        inputRef={{ current: null }}
        lastAnswer={null}
        lastCorrect={null}
        formatValue={(value, preserve) => formatDecimal(value, "en", preserve)}
        formatInteger={(value) => new Intl.NumberFormat("en").format(value)}
        onInputChange={vi.fn()}
        onInputSubmit={vi.fn()}
        onAnswer={vi.fn()}
      />
    );
    expect(screen.getByText("ten to the power of 3")).toHaveClass("sr-only");
    expect(screen.getByText("Move the decimal point 3 places right.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Answer option 12,340" })).toBeVisible();
  });

  it("allows comma decimal input and submits with Enter", () => {
    const onSubmit = vi.fn();
    function Harness() {
      const [value, setValue] = React.useState("");
      return (
        <AnswerInput
          value={value}
          inputRef={{ current: null }}
          disabled={false}
          onChange={setValue}
          onSubmit={onSubmit}
          labels={{ placeholder: "Answer", submit: "Submit", hint: "Hint" }}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Answer" });
    fireEvent.change(input, { target: { value: "12,34" } });
    expect(input).toHaveValue("12,34");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
