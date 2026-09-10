"use client";

import { DashboardFormField, dashboardFieldClassName } from "@/components/admin/dashboard-form";
import type { ClientInterestCatalogService } from "@/lib/clients/interest";

export type ClientInterestFormValue = {
  interestServiceId: string;
  interestSubcategoryId: string;
  interestPlanId: string;
};

type ClientInterestFieldsProps = {
  catalog: ClientInterestCatalogService[];
  isLoading?: boolean;
  error?: string;
  value: ClientInterestFormValue;
  onChange: (value: ClientInterestFormValue) => void;
};

export function ClientInterestFields({
  catalog,
  isLoading = false,
  error,
  value,
  onChange,
}: ClientInterestFieldsProps) {
  const selectedService = catalog.find((service) => service.id === value.interestServiceId) ?? null;
  const categories = selectedService?.categories ?? [];
  const selectedCategory = categories.find((category) => category.id === value.interestSubcategoryId) ?? null;
  const plans = selectedCategory?.plans ?? [];

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardFormField label="Servicio" htmlFor="client-interest-service" className="lg:col-span-1">
        <select
          id="client-interest-service"
          value={value.interestServiceId}
          disabled={isLoading}
          onChange={(event) =>
            onChange({
              interestServiceId: event.target.value,
              interestSubcategoryId: "",
              interestPlanId: "",
            })
          }
          className={dashboardFieldClassName}
        >
          <option value="">{isLoading ? "Cargando catálogo..." : "Selecciona un servicio"}</option>
          {catalog.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </DashboardFormField>

      <DashboardFormField label="Categoría" htmlFor="client-interest-category">
        <select
          id="client-interest-category"
          value={value.interestSubcategoryId}
          disabled={!selectedService || categories.length === 0}
          onChange={(event) =>
            onChange({
              ...value,
              interestSubcategoryId: event.target.value,
              interestPlanId: "",
            })
          }
          className={dashboardFieldClassName}
        >
          <option value="">
            {!selectedService
              ? "Elige primero un servicio"
              : categories.length === 0
                ? "Este servicio no tiene categorías"
                : "Selecciona una categoría"}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </DashboardFormField>

      <DashboardFormField label="Plan" htmlFor="client-interest-plan">
        <select
          id="client-interest-plan"
          value={value.interestPlanId}
          disabled={!selectedCategory || plans.length === 0}
          onChange={(event) => onChange({ ...value, interestPlanId: event.target.value })}
          className={dashboardFieldClassName}
        >
          <option value="">
            {!selectedCategory
              ? "Elige primero una categoría"
              : plans.length === 0
                ? "Esta categoría no tiene planes"
                : "Selecciona un plan"}
          </option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </DashboardFormField>

      {error ? (
        <p className="sm:col-span-2 lg:col-span-3 text-xs font-medium text-red-600">{error}</p>
      ) : (
        <p className="sm:col-span-2 lg:col-span-3 text-xs text-muted">
          Puedes asociar solo el servicio, o también una categoría y un plan del catálogo.
        </p>
      )}
    </div>
  );
}
