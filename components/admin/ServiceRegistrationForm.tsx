"use client";

import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  category: "",
  description: "",
  price: "",
  discount: "0",
};

export function ServiceRegistrationForm() {
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/services", { method: "GET" });
        if (!response.ok) return;
        const data = (await response.json().catch(() => ({}))) as { categories?: Array<{ name: string }> };
        const names = (data.categories ?? []).map((category) => category.name).filter(Boolean);
        setCategories(names);
      } catch {
        setCategories([]);
      }
    }

    loadCategories();
  }, []);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discount: Number(form.discount),
      };

      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "No se pudo crear el servicio.");
        setIsSubmitting(false);
        return;
      }

      setSuccess("Servicio registrado correctamente.");
      setForm(emptyForm);
      const refreshed = await fetch("/api/services", { method: "GET" });
      const refreshedData = (await refreshed.json().catch(() => ({}))) as { categories?: Array<{ name: string }> };
      setCategories((refreshedData.categories ?? []).map((category) => category.name).filter(Boolean));
    } catch {
      setError("No se pudo registrar el servicio. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Servicios</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-foreground">Agregar servicio</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-foreground">Nombre del servicio</span>
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            placeholder="Landing Page Pro"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Categoría</span>
          <input
            list="service-categories"
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            placeholder="Desarrollo Web"
          />
          <datalist id="service-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Precio</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(event) => updateField("price", event.target.value)}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            placeholder="299990"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Descuento (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.discount}
            onChange={(event) => updateField("discount", event.target.value)}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            placeholder="10"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-foreground">Descripción</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            placeholder="Describe qué incluye el servicio, cómo funciona y sus principales beneficios."
          />
        </label>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Guardando..." : "Registrar servicio"}
      </button>
    </form>
  );
}
