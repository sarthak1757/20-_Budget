import { useState, type FormEvent } from "react";
import { adminItemSchema, type AdminItemPayload, type Item } from "@budget-draft/shared";
import { validateForm, type FieldErrors } from "../../lib/formErrors";
import { Button } from "../ui";
import { Field } from "./Field";

interface ItemFormProps {
  initial?: Item; // editing when set, creating otherwise
  onSave: (values: AdminItemPayload) => Promise<void>;
  onCancel?: () => void;
}

export function ItemForm({ initial, onSave, onCancel }: ItemFormProps) {
  const isEditing = initial !== undefined;
  const [name, setName] = useState(initial?.name ?? "");
  const [tag, setTag] = useState(initial?.tag ?? "");
  // Number inputs are kept as text while typing, then converted on save.
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [rating, setRating] = useState(initial ? String(initial.rating) : "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const values: Record<string, unknown> = {
      name,
      tag,
      price: price.trim() === "" ? Number.NaN : Number(price),
      rating: rating.trim() === "" ? Number.NaN : Number(rating),
    };
    // An empty emoji means "no emoji" (initials avatar), not an empty string.
    if (emoji.trim() !== "") {
      values.emoji = emoji.trim();
    }
    const result = validateForm(adminItemSchema, values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSave(result.data);
      if (!isEditing) {
        setName("");
        setTag("");
        setPrice("");
        setRating("");
        setEmoji("");
      }
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Couldn't save" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1.2fr_5rem_5rem_4rem]">
        <Field label="Name" value={name} onChange={setName} error={errors.name} />
        <Field label="Tag" value={tag} onChange={setTag} error={errors.tag} placeholder="Striker" />
        <Field label="Price $" type="number" value={price} onChange={setPrice} error={errors.price} />
        <Field label="Rating" type="number" value={rating} onChange={setRating} error={errors.rating} />
        <Field label="Emoji" value={emoji} onChange={setEmoji} error={errors.emoji} />
      </div>
      {errors.form && (
        <p role="alert" className="text-sm text-rose-400">
          {errors.form}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="py-2">
          {saving ? "Saving…" : isEditing ? "Save item" : "Add item"}
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
