"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

type PendingButtonProps = Readonly<{
  ariaLabel?: string;
  children: string;
  className: string;
  disabled?: boolean;
  form?: string;
  pendingText?: string;
  type?: "button" | "submit";
}>;

export function PendingButton({
  ariaLabel,
  children,
  className,
  disabled = false,
  form,
  pendingText = "Working...",
  type = "submit",
}: PendingButtonProps) {
  const [clicked, setClicked] = useState(false);
  const isSubmit = type === "submit";

  return (
    <button
      className={className}
      aria-label={ariaLabel}
      disabled={clicked || disabled}
      form={form}
      onClick={(event) => {
        const formElement = form
          ? document.getElementById(form)
          : event.currentTarget.form;

        if (
          isSubmit &&
          formElement instanceof HTMLFormElement &&
          !formElement.reportValidity()
        ) {
          return;
        }

        window.setTimeout(() => {
          setClicked(true);
        }, 0);
      }}
      type={type}
    >
      {clicked ? pendingText : children}
    </button>
  );
}

export function FormPendingButton({
  ariaLabel,
  children,
  className,
  disabled = false,
  pendingText = "Working...",
}: PendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label={ariaLabel}
      className={className}
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? pendingText : children}
    </button>
  );
}
