module.exports = (locale, controller) => {

    const userLanguage = locale.split('-')[0];
    const validLanguages = {
        pt: require('../i18n/pt')
    };

    const validPikaday = {
        pt: {
            format: 'DD/MM/YYYY',
            i18n: {
                previousMonth: 'Mes Anterior', nextMonth: 'Mes Seguinte',
                months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
                weekdays: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
                weekdaysShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
            }
        }
    };

    const numeralConversor = {
        pt: 'pt-br'
    };

    const language = validLanguages[userLanguage] ? userLanguage : 'pt';

    document.documentElement.setAttribute('lang', language);

    const pikaday = $.fn.pikaday;
    $.fn.pikaday = function () {
        const args = Array.from(arguments);
        if (typeof args[0] !== 'object') {
            args[0] = {};
        }
        args[0].format = validPikaday[language].format;
        args[0].i18n = validPikaday[language].i18n;
        return pikaday.apply(this, args);
    };

    try {
        moment.locale(language);
        numeral.locale(numeralConversor[language]);
    } catch (e) {
        /* pass */
    }

    const validLanguage = validLanguages[language];
    validLanguage.pikaday = validPikaday[language];
    return validLanguage;
};
