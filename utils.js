function getCurrentLocale() {
    return (new Intl.DateTimeFormat()).resolvedOptions().locale
}