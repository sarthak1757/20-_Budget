import { useState, type FormEvent } from "react";
import { adminCategorySchema, type AdminCategoryPayload } from "@budget-draft/shared";
import { validateForm, type FieldErrors } from "../../lib/formErrors";
import { UrgentNote } from "../brand/primitives";
import { Button } from "../ui";
import { Field } from "./Field";

interface CategoryFormProps {
  initial?: AdminCategoryPayload; // editing when set, creating otherwise
  onSave: (values: AdminCategoryPayload) => Promise<void>;
  onCancel?: () => void;
}

export function CategoryForm({ initial, onSave, onCancel }: CategoryFormProps) {
  const isEditing = initial !== undefined;
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateForm(adminCategorySchema, { slug, name, emoji, description });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSave(result.data);
      if (!isEditing) {
        setSlug("");
        setName("");
        setEmoji("");
        setDescription("");
      }
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Couldn't save" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid grid-cols-[1fr_5rem] gap-3">
        <Field label="Name" value={name} onChange={setName} error={errors.name} />
        <Field label="Emoji" value={emoji} onChange={setEmoji} error={errors.emoji} />
      </div>
      {/* The slug can't change later: items and saved games refer to it. */}
      <Field
        label="Slug (URL id, can't change later)"
        value={slug}
        onChange={(value) => setSlug(value.toLowerCase())}
        error={errors.slug}
        disabled={isEditing}
        placeholder="board-games"
      />
      <Field label="Description" value={description} onChange={setDescription} error={errors.description} />
      {errors.form && (
        <p role="alert">
          <UrgentNote>{errors.form}</UrgentNote>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving} className="py-2">
          {saving ? "Saving…" : isEditing ? "Save category" : "Add category"}
        </Button>
        {onCancel && (
          <Button variant="ghost" className="py-2" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
