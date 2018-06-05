// # i18n setup
// sets up the internationalization instance

// import dependencies
import * as i18n from 'i18n';

// configure i18n
i18n.configure({
    locales: ['en'],
    defaultLocale: 'en',
    objectNotation: true,
    directory: './translations'
});

// set locale
i18n.setLocale('en');

// export for use elsewhere
export default i18n;
