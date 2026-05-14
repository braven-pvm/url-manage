"use client";

import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = Readonly<{
  children: string;
  className: string;
  confirmMessage: string;
  disabled?: boolean;
  pendingText?: string;
  ariaLabel?: string;
}>;

export function ConfirmSubmitButton({
  ariaLabel,
  children,
  className,
  confirmMessage,
  disabled = false,
  pendingText = "Working...",
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label={ariaLabel}
      className={className}
      disabled={pending || disabled}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }

        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? pendingText : children}
    </button>
  );
}
