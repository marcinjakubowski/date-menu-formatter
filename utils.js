var PrefFields = {
    PATTERN             : 'pattern',
    USE_DEFAULT_LOCALE  : 'use-default-locale',
    CUSTOM_LOCALE       : 'custom-locale',
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