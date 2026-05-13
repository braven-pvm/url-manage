import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, TagChip, UrlDisplay } from "./ui";

describe("admin UI primitives", () => {
  it("renders purpose and category badges with deterministic text", () => {
    render(
      <div>
        <Badge tone="amber">Temporary</Badge>
        <Badge tone="blue">Print / QR</Badge>
        <Badge tone="green">Matched</Badge>
      </div>,
    );

    expect(screen.getByText("Temporary")).toHaveClass("bg-amber-50");
    expect(screen.getByText("Print / QR")).toHaveClass("bg-blue-50");
    expect(screen.getByText("Matched")).toHaveClass("bg-emerald-50");
  });

  it("renders neutral tag chips", () => {
    render(<TagChip>energy-bar</TagChip>);
    expect(screen.getByText("energy-bar")).toHaveClass("bg-[var(--pvm-bg)]");
  });

  it("renders the href as the full clickable URL in monospace", () => {
    render(<UrlDisplay href="https://go.pvm.co.za/ptn-1" />);

    expect(
      screen.getByRole("link", { name: "https://go.pvm.co.za/ptn-1" }),
    ).toHaveAttribute("href", "https://go.pvm.co.za/ptn-1");
  });
});
