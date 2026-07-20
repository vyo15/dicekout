export const formatLongDate = (value, locale = "id-ID") => value
  ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(`${value}T00:00:00Z`))
  : null;
