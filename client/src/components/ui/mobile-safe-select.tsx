
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface SelectOption {
  value: string;
  label: string;
}

interface MobileSafeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  id?: string;
}

export function MobileSafeSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  className = "",
  id
}: MobileSafeSelectProps) {
  // Detectar si es móvil
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

  if (isMobile) {
    // Usar select nativo en móviles
    return (
      <select
        id={id}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        autoComplete="new-password"
        autoCorrect="off"
        spellCheck={false}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  // Usar Radix UI Select en escritorio
  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className={className} id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-[200px]" sideOffset={4}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
