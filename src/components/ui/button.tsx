import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm font-mono text-[11px] tracking-[0.18em] uppercase transition-colors disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-cyan text-canvas hover:bg-cyan/90 shadow-[0_0_24px_rgba(62,224,212,0.18)]",
        ghost:
          "border border-line bg-transparent text-ink hover:border-cyan/40 hover:text-cyan",
        subtle: "bg-raised text-mute hover:text-ink hover:bg-line/60",
        danger: "border border-rose/40 text-rose hover:bg-rose/10",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-[10px]",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  },
);

Button.displayName = "Button";
