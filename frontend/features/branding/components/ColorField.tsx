import type { UseFormRegister } from "react-hook-form";
import type { BrandFormValues } from "../schemas/branding.schema";

type ColorName = "primary" | "primaryDark" | "accent" | "background" | "surface" | "foreground" | "muted" | "line" | "buttonText" | "secondary" | "secondaryText" | "success" | "warning" | "danger" | "topbarText" | "gradientColor" | "headerColor" | "headerGradientColor" | "menuColor" | "menuGradientColor" | "headerTitleColor" | "headerSubtitleColor";
export function ColorField({ label, name, register }: { label: string; name: ColorName; register: UseFormRegister<BrandFormValues> }) { return <label className="field"><span>{label}</span><input type="color" {...register(name)} /></label>; }
