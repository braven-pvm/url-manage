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
    expect(
      screen.getByRole("columnheader", { name: "CLICKS" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "STATUS" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "UPDATED" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Actions" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Print / QR")).toBeInTheDocument();
    expect(screen.getByText("energy-bar")).toBeInTheDocument();
    expect(screen.getByText("qr")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "go.pvm.co.za/care" }),
    ).toHaveAttribute("href", "https://go.pvm.co.za/care");
    expect(
      screen.getByRole("link", { name: "go.pvm.co.za/care" }),
    ).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/redirects/r1",
    );
    expect(screen.getByRole("link", { name: "Care" })).toHaveAttribute(
      "href",
      "/redirects/r1",
    );
    expect(
      screen.getByRole("link", { name: "shop.pvm.co.za/care" }),
    ).toHaveAttribute("href", "https://shop.pvm.co.za/care");
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
