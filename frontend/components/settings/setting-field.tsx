"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingFieldProps {
  setting: {
    key: string;
    value: string;
    type: "string" | "number" | "boolean" | "json" | "select";
    description?: string;
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
    disabled?: boolean;
  };
  value: string;
  onChange: (key: string, value: string) => void;
}

export function SettingField({ setting, value, onChange }: SettingFieldProps) {
  const { key, type, description, options, placeholder, disabled } = setting;

  switch (type) {
    case "boolean":
      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={key}
            checked={value === "true" || value === "1"}
            onCheckedChange={(checked) =>
              onChange(key, checked ? "true" : "false")
            }
            disabled={disabled}
          />
          <Label
            htmlFor={key}
            className={`cursor-pointer ${disabled ? "opacity-50" : ""}`}
          >
            {description || key}
          </Label>
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <Label htmlFor={key}>{description || key}</Label>
          <Input
            id={key}
            type="number"
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
      );

    case "json":
      return (
        <div className="space-y-2">
          <Label htmlFor={key}>{description || key}</Label>
          <Textarea
            id={key}
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            rows={4}
            className="font-mono text-sm"
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label htmlFor={key}>{description || key}</Label>
          <Select
            value={value}
            onValueChange={(val) => onChange(key, val)}
            disabled={disabled}
          >
            <SelectTrigger id={key}>
              <SelectValue placeholder={placeholder || "Seleziona..."} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    default: // string
      return (
        <div className="space-y-2">
          <Label htmlFor={key}>{description || key}</Label>
          <Input
            id={key}
            type="text"
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
      );
  }
}

interface SettingsGridProps {
  settings: Array<{
    key: string;
    value: string;
    type: "string" | "number" | "boolean" | "json" | "select";
    description?: string;
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
    disabled?: boolean;
  }>;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  columns?: 1 | 2 | 3;
}

export function SettingsGrid({
  settings,
  values,
  onChange,
  columns = 2,
}: SettingsGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
  };

  return (
    <div className={`grid gap-6 ${gridCols[columns]}`}>
      {settings.map((setting) => (
        <SettingField
          key={setting.key}
          setting={setting}
          value={values[setting.key] || setting.value}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
