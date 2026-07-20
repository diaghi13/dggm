import * as React from "react"
import { cn } from "@/lib/utils"
import { resolveError, type ErrorProp } from "@/lib/utils/resolve-error"

type TextareaProps = React.ComponentProps<"textarea"> & {
  error?: ErrorProp;
};

function Textarea({ className, error, ...props }: TextareaProps) {
  const errorMsg = resolveError(error);
  return (
    <>
      <textarea
        data-slot="textarea"
        aria-invalid={!!errorMsg}
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
      {errorMsg && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errorMsg}</p>
      )}
    </>
  )
}

export { Textarea }
