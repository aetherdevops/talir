export const transliterate = (text: string): string => {
    if (!text) return '';

    const map: { [key: string]: string } = {
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ѓ': 'Gj', 'Е': 'E',
        'Ж': 'Zh', 'З': 'Z', 'S': 'Dz', 'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L',
        'Љ': 'Lj', 'М': 'M', 'Н': 'N', 'Њ': 'Nj', 'О': 'O', 'П': 'P', 'Р': 'R',
        'С': 'S', 'Т': 'T', 'Ќ': 'Kj', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C',
        'Ч': 'Ch', 'Џ': 'Dzh', 'Ш': 'Sh',
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ѓ': 'gj', 'е': 'e',
        'ж': 'zh', 'з': 'z', 'ѕ': 'dz', 'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l',
        'љ': 'lj', 'м': 'm', 'н': 'n', 'њ': 'nj', 'о': 'o', 'п': 'p', 'р': 'r',
        'с': 's', 'т': 't', 'ќ': 'kj', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
        'ч': 'ch', 'џ': 'dzh', 'ш': 'sh'
    };

    // Specific Company Overrides for cleaner/official English names
    const overrides: { [key: string]: string } = {
        'Комерцијална банка АД Скопје': 'Komercijalna Banka AD Skopje',
        'Алкалоид АД Скопје': 'Alkaloid AD Skopje',
        'Гранит АД Скопје': 'Granit AD Skopje',
        'Макпетрол АД Скопје': 'Makpetrol AD Skopje',
        'Македонски Телеком АД': 'Makedonski Telekom AD',
        'НЛБ Банка АД Скопје': 'NLB Banka AD Skopje',
        'Стопанска банка АД Скопје': 'Stopanska Banka AD Skopje',
        'ТТК Банка АД Скопје': 'TTK Banka AD Skopje',
        'Уни Банка АД Скопје': 'Uni Banka AD Skopje',
        'Охридска банка АД Скопје': 'Ohridska Banka AD Skopje',
        'Реплек АД Скопје': 'Replek AD Skopje',
        'Прилепска Пиварница АД Прилеп': 'Prilepska Pivarnica AD Prilep',
        'Витаминка АД Прилеп': 'Vitaminka AD Prilep',
        'Фершпед АД Скопје': 'Fersped AD Skopje',
        'Тутунски Комбинат АД Прилеп': 'Tutunski Kombinat AD Prilep',
        'Макошпед АД Скопје': 'Makosped AD Skopje',
        'Окта АД Скопје': 'Okta AD Skopje',
        'Либерти АД Скопје': 'Liberty AD Skopje',
        'РЖ Услуги АД Скопје': 'RZ Uslugi AD Skopje',
        'РЖ Институт АД Скопје': 'RZ Institut AD Skopje',
        'РЖ Техничка контрола АД Скопје': 'RZ Tehnichka Kontrola AD Skopje',
        'Цементарница УСЈЕ АД Скопје': 'Cementarnica USJE AD Skopje',
        'ФЗЦ 11 Октомври АД Куманово': 'FZC 11 Oktomvri AD Kumanovo',
        'Факом АД Скопје': 'Fakot AD Skopje',
        'Бим АД Свети Николе': 'BIM AD Sveti Nikole',
        'АрцелорМиттал (ХРМ) АД Скопје': 'ArcelorMittal (HRM) AD Skopje',
        'Дебарски Бањи - Цапа АД Дебар': 'Debarski Banji - Capa AD Debar',
        'Интерпромет АД Тетово': 'Interpromet AD Tetovo',
        'Жито Лукс АД Скопје': 'Zito Luks AD Skopje',
        'Могила промет АД': 'Mogila Promet AD',
        'Макстил АД Скопје': 'Makstil AD Skopje',
        'Стопанска банка АД Битола': 'Stopanska Banka AD Bitola',
        // Add more as needed
    };

    // Check overrides first (case-insensitive key check could be better but direct match is faster)
    if (overrides[text]) {
        return overrides[text];
    }

    return text.split('').map(char => map[char] || char).join('');
};
