// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['es', 'en'] as const;
export const defaultLocale = 'es' as const;

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Opcional: si quieres que la URL por defecto no tenga el prefijo /es
  // localePrefix: 'as-needed'
});

// Exporta los helpers de navegación para usarlos en tus componentes
export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation(routing);
