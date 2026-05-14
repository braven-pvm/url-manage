import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PendingButton } from "./PendingButton";

describe("PendingButton", () => {
  it("submits an external form explicitly before entering the pending state", async () => {
    const user = userEvent.setup();
    const requestSubmit = vi.fn();

    render(
      <>
        <form id="redirect-form">
          <input name="title" required defaultValue="Octane" />
        </form>
        <PendingButton
          className="button"
          form="redirect-form"
          pendingText="Saving..."
        >
          Save redirect
        </PendingButton>
      </>,
    );

    const form = document.getElementById("redirect-form");
    expect(form).toBeInstanceOf(HTMLFormElement);
    vi.spyOn(form as HTMLFormElement, "requestSubmit").mockImplementation(
      requestSubmit,
    );

    await user.click(screen.getByRole("button", { name: "Save redirect" }));

    expect(requestSubmit).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });
});
