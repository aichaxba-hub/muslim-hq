import { Landmark, Users } from "lucide-react";

type Props = {
  congregation: boolean;
  masjid: boolean;
  onToggleCongregation: (v: boolean) => void;
  onToggleMasjid: (v: boolean) => void;
  compact?: boolean;
};

function Pill({
  active,
  label,
  icon,
  title,
  onClick,
  compact,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 transition-colors ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } ${
        active
          ? "bg-[color:var(--sage)] text-white ring-transparent"
          : "bg-transparent text-muted-foreground ring-border hover:ring-[color:var(--sage)]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/** Two fully independent toggles: praying in congregation, and praying at the masjid. */
export function PrayerPlaceToggles({
  congregation,
  masjid,
  onToggleCongregation,
  onToggleMasjid,
  compact,
}: Props) {
  const size = compact ? 11 : 13;
  return (
    <div className="flex items-center gap-1.5">
      <Pill
        active={congregation}
        label="Jama'ah"
        icon={<Users size={size} />}
        title="Prayed in congregation"
        onClick={() => onToggleCongregation(!congregation)}
        compact={compact}
      />
      <Pill
        active={masjid}
        label="Masjid"
        icon={<Landmark size={size} />}
        title="Prayed at the masjid"
        onClick={() => onToggleMasjid(!masjid)}
        compact={compact}
      />
    </div>
  );
}
