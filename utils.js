function getCurrentLocale() {
    return (new Intl.DateTimeFormat()).resolvedOptions().locale
}

function convertToPattern(str) {
    return '#' + str.replaceAll("\\n", "\n").replaceAll("''", ">`<")
}

function convertFromPattern(str) {
    return str.replaceAll('>`<', "'")
}