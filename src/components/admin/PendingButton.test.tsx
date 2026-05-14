import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { PendingButton } from "./PendingButton";

describe("PendingButton", () => {
  it("leaves external form submission to the browser without disabling the submitter", async () => {
    const user = userEvent.setup();
    const submitHandler = vi.fn((event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
    });

    render(
      <>
        <form id="redirect-form" onSubmit={submitHandler}>
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
    const requestSubmit = vi.spyOn(form as HTMLFormElement, "requestSubmit");

    await user.click(screen.getByRole("button", { name: "Save redirect" }));

    expect(requestSubmit).not.toHaveBeenCalled();
    expect(submitHandler).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Save redirect" })).toBeEnabled();
  });
});
