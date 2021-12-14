var PrefFields = {
    PATTERN             : 'pattern',
    USE_DEFAULT_LOCALE  : 'use-default-locale',
    CUSTOM_LOCALE       : 'custom-locale',
    FONT_SIZE           : 'font-size',
    APPLY_ALL_PANELS    : 'apply-all-panels',
    REMOVE_MESSAGES_INDICATOR: 'remove-messages-indicator'
};

function getCurrentLocale() {
    return (new Intl.DateTimeFormat()).resolvedOptions().locale
}

function convertToPattern(str) {
    return '#' + str.replaceAll("\\n", "\n").replaceAll("''", ">`<")
}

function convertFromPattern(str) {
    return str.replaceAll('>`<', "'")
}