import { Checkbox } from './checkbox';
import { Label } from './label';

interface ArchivedToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ArchivedToggle({ id, label, checked, onCheckedChange }: ArchivedToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      <Label htmlFor={id} className="cursor-pointer text-[13px] font-normal text-text-label">
        {label}
      </Label>
    </div>
  );
}
