import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes } from "react";

// Interface pour les props de Section
interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Espacement vertical de la section
   * @default "default"
   */
  spacing?: "none" | "sm" | "default" | "lg" | "xl" | "2xl";
  /**
   * Couleur de fond de la section
   * @default "transparent"
   */
  background?: "transparent" | "white" | "gray" | "primary" | "secondary" | "gradient";
  /**
   * Bordure de la section
   * @default "none"
   */
  border?: "none" | "top" | "bottom" | "both";
  /**
   * Centrage du contenu
   * @default true
   */
  centered?: boolean;
  /**
   * Classe CSS personnalisée
   */
  className?: string;
  /**
   * Utilisation d'un tag HTML sémantique
   * @default "section"
   */
  as?: "section" | "div" | "article" | "aside" | "header" | "footer" | "main";
}

// Variants pour les espacements
const spacingVariants = {
  none: "py-0",
  sm: "py-6 sm:py-8",
  default: "py-8 sm:py-12 lg:py-16",
  lg: "py-12 sm:py-16 lg:py-20",
  xl: "py-16 sm:py-20 lg:py-24",
  "2xl": "py-20 sm:py-24 lg:py-32"
};

// Variants pour les couleurs de fond
const backgroundVariants = {
  transparent: "bg-transparent",
  white: "bg-white dark:bg-gray-900",
  gray: "bg-gray-50 dark:bg-gray-800",
  primary: "bg-btp-orange-500 text-white dark:bg-btp-orange-600",
  secondary: "bg-btp-blue-500 text-white dark:bg-btp-blue-600",
  gradient: "btp-gradient text-white"
};

// Variants pour les bordures
const borderVariants = {
  none: "",
  top: "border-t border-gray-200 dark:border-gray-700",
  bottom: "border-b border-gray-200 dark:border-gray-700",
  both: "border-t border-b border-gray-200 dark:border-gray-700"
};

/**
 * Composant Section réutilisable pour les sections de page
 * Utilisé pour structurer le contenu avec des espacements et styles cohérents
 */
const Section = forwardRef<HTMLDivElement, SectionProps>(
  ({
    spacing = "default",
    background = "transparent",
    border = "none",
    centered = true,
    className,
    as = "section",
    children,
    ...props
  }, ref) => {
    const Component = as;
    
    return (
      <Component
        ref={ref}
        className={cn(
          // Base de la section
          "w-full",
          // Espacement vertical
          spacingVariants[spacing],
          // Couleur de fond
          backgroundVariants[background],
          // Bordures
          borderVariants[border],
          // Centrage
          centered && "text-center",
          // Transitions
          "transition-all duration-300",
          // Classe personnalisée
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Section.displayName = "Section";

export { Section };
export type { SectionProps };
