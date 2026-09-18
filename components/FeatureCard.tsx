import { type LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export default function FeatureCard({ icon: Icon, title, description, index }: FeatureCardProps) {
  return (
    <div className="paper-card flex flex-col gap-4 p-6 transition-shadow hover:shadow-raised">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-light text-emerald">
          <Icon size={19} strokeWidth={2} />
        </span>
        <span className="font-mono text-[12px] text-ink-faint">0{index}</span>
      </div>
      <div>
        <h3 className="font-display text-[18px] font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{description}</p>
      </div>
    </div>
  );
}
