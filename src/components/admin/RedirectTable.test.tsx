import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RedirectTable } from "./RedirectTable";

describe("RedirectTable", () => {
  it("renders redirect rows with links, destinations, and click counts", () => {
    render(
      <RedirectTable
        rows={[
          {
            id: "r1",
            code: "care",
            title: "Care",
            destinationUrl: "https://shop.pvm.co.za/care",
            updatedAt: new Date("2026-05-12T00:00:00.000Z"),
            _count: { clickEvents: 7 },
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "care" })).toHaveAttribute(
      "href",
      "/admin/redirects/r1",
    );
    expect(screen.getByText("Care")).toBeInTheDocument();
    expect(screen.getByText("https://shop.pvm.co.za/care")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
