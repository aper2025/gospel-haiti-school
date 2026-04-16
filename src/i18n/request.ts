import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

// Resolves the active locale from (in order): NEXT_LOCALE cookie → Accept-Language header → default (fr).
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;

  let locale: Locale = defaultLocale;
  if (cookieLocale && locales.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const headerStore = await headers();
    const accept = headerStore.get("accept-language") ?? "";
    const preferred = accept.split(",")[0]?.split("-")[0];
    if (preferred && (locales as readonly string[]).includes(preferred)) {
      locale = preferred as Locale;
    }
  }

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return { locale, messages };
});
