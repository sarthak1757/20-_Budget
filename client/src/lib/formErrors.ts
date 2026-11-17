import type { z } from "zod";

export type FieldErrors = Record<string, string>;

// Runs a zod schema on form values and returns either the parsed data or
// one error message per field, ready to show under each input.
export function validateForm<T extends z.ZodType>(
  schema: T,
  values: unknown,
): { ok: true; data: z.infer<T> } | { ok: false; errors: FieldErrors } {
  const result = schema.safeParse(values);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.length > 0 ? String(issue.path[0]) : "form";
    // Keep the first problem for each field; one message at a time is easier to read.
    if (errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return { ok: false, errors };
}
