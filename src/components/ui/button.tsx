import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-[13px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-ink text-canvas hover:bg-ink/90",
        ghost: "border border-line bg-canvas text-ink hover:bg-raised",
        subtle: "bg-raised text-mute hover:text-ink hover:bg-line/70",
        danger: "border border-rose/30 text-rose hover:bg-rose/5",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-2.5 text-[12px]",
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
