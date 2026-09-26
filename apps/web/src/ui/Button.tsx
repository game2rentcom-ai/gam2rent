import { Link } from "react-router-dom";

// The one button. Every size is at least 40 px tall (44 px by default) so it is easy to hit with a
// thumb. Renders a router link when given `to`, an external link when given `href`, else a <button>.
type Variant = "primary" | "secondary" | "ghost" | "success";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  success: "btn-success",
};
const SIZES: Record<Size, string> = {
  sm: "min-h-10 px-4 text-sm [--cut:8px]",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-13 px-6 text-base [--cut:12px]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  className?: string;
  children: React.ReactNode;
}
type ButtonProps = CommonProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { to?: undefined; href?: undefined };
type RouterLinkProps = CommonProps & { to: string; href?: undefined; onClick?: () => void };
type ExternalProps = CommonProps & { href: string | undefined; to?: undefined; disabled?: boolean };

export function Button(props: ButtonProps | RouterLinkProps | ExternalProps) {
  const { variant = "primary", size = "md", full = false, className = "", children } = props;
  const cls = `cut inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-sm font-display font-bold tracking-wide ${VARIANTS[variant]} ${SIZES[size]} ${full ? "w-full" : ""} ${className}`;

  if ("to" in props && props.to !== undefined) {
    return <Link to={props.to} onClick={props.onClick} className={cls}>{children}</Link>;
  }
  if ("href" in props) {
    // A missing href means "not available" (e.g. no contact number configured): show it disabled.
    if (!props.href || props.disabled) {
      return <span aria-disabled="true" className={`${cls} pointer-events-none opacity-50`}>{children}</span>;
    }
    return <a href={props.href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>;
  }
  const { variant: _v, size: _s, full: _f, className: _c, children: _ch, ...rest } = props;
  void [_v, _s, _f, _c, _ch];
  return <button type="button" {...rest} className={`${cls} disabled:pointer-events-none disabled:opacity-50`}>{children}</button>;
}
