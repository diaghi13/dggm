'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DdtTypeBadge } from '@/components/warehouse/ddt-type-badge';

interface DdtTypeSelectProps {
  value?: App.Enums.DdtType;
  onValueChange: (value: App.Enums.DdtType) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ddtTypeDescriptions: Record<App.Enums.DdtType, string> = {
  incoming: 'Carico merce da fornitore',
  outgoing: 'Scarico merce a cliente o cantiere',
  internal: 'Trasferimento tra magazzini interni',
  rental_out: 'Noleggio merce in uscita',
  rental_return: 'Rientro merce da noleggio',
  return_from_customer: 'Reso da parte del cliente',
  return_to_supplier: 'Reso merce a fornitore',
};

export function DdtTypeSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Seleziona tipo DDT',
}: DdtTypeSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {value && <DdtTypeBadge type={value} />}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(ddtTypeDescriptions) as App.Enums.DdtType[]).map((type) => (
          <SelectItem key={type} value={type}>
            <div className="flex flex-col gap-1 py-1">
              <DdtTypeBadge type={type} />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {ddtTypeDescriptions[type]}
              </p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
