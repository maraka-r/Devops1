import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes } from "react";

// Interface pour les props du Container
interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Taille maximale du conteneur
   * @default "7xl"
   */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  /**
   * Padding interne du conteneur
   * @default "default"
   */
  padding?: "none" | "sm" | "default" | "lg" | "xl";
  /**
   * Centrage du conteneur
   * @default true
   */
  centered?: boolean;
  /**
   * Affichage responsive ou non
   * @default true
   */
  responsive?: boolean;
  /**
   * Classe CSS personnalisée
   */
  className?: string;
}

// Variants pour les tailles maximales
const sizeVariants = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full"
};

// Variants pour les paddings
const paddingVariants = {
  none: "p-0",
  sm: "px-4 py-2 sm:px-6",
  default: "px-4 py-4 sm:px-6 lg:px-8",
  lg: "px-6 py-6 sm:px-8 lg:px-12",
  xl: "px-8 py-8 sm:px-12 lg:px-16"
};

/**
 * Composant Container réutilisable pour le wrapping responsive
 * Utilisé pour centrer le contenu et gérer les marges/paddings
 */
const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({
    size = "7xl",
    padding = "default",
    centered = true,
    responsive = true,
    className,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base du conteneur
          "w-full",
          // Taille maximale
          sizeVariants[size],
          // Centrage
          centered && "mx-auto",
          // Padding
          paddingVariants[padding],
          // Responsive (optionnel)
          responsive && "transition-all duration-300",
          // Classe personnalisée
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";

export { Container };
export type { ContainerProps };
