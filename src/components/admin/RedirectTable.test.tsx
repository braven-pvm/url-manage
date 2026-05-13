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
            category: "Product",
            purpose: "Product packaging",
            tags: ["energy-bar", "qr"],
            title: "Care",
            destinationUrl: "https://shop.pvm.co.za/care",
            updatedAt: new Date("2026-05-12T00:00:00.000Z"),
            _count: { clickEvents: 7 },
          },
        ]}
        shortUrlBase="https://go.pvm.co.za"
      />,
    );

    expect(
      screen.getByRole("columnheader", { name: "SHORT URL" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "TITLE / DESTINATION" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "CATEGORY" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "PURPOSE" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "TAGS" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Product packaging")).toBeInTheDocument();
    expect(screen.getByText("energy-bar")).toBeInTheDocument();
    expect(screen.getByText("qr")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "https://go.pvm.co.za/care" }),
    ).toHaveAttribute("href", "https://go.pvm.co.za/care");
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/admin/redirects/r1",
    );
    expect(screen.getByText("Care")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "https://shop.pvm.co.za/care" }),
    ).toHaveAttribute("href", "https://shop.pvm.co.za/care");
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
