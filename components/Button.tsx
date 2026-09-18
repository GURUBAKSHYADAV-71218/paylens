import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  className?: string;
  children: React.ReactNode;
}

interface ButtonAsLink extends BaseProps {
  href: string;
  onClick?: never;
  type?: never;
}

interface ButtonAsButton extends BaseProps {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

type ButtonProps = ButtonAsLink | ButtonAsButton;

const variantClasses: Record<Variant, string> = {
  primary: "bg-emerald text-white hover:bg-emerald-dark shadow-card",
  secondary: "bg-paper-raised text-ink border border-line hover:border-ink/30",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
};

const sizeClasses: Record<Size, string> = {
  md: "px-5 py-2.5 text-[14px]",
  lg: "px-6 py-3.5 text-[15px]",
};

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    icon: Icon,
    iconPosition = "right",
    className,
    children,
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  const content = (
    <>
      {Icon && iconPosition === "left" && <Icon size={17} strokeWidth={2.25} />}
      {children}
      {Icon && iconPosition === "right" && <Icon size={17} strokeWidth={2.25} />}
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button
      type={buttonProps.type ?? "button"}
      onClick={buttonProps.onClick}
      disabled={buttonProps.disabled}
      className={classes}
    >
      {content}
    </button>
  );
}
