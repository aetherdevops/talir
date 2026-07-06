/** Macedonian Latin → Cyrillic for issuer names (MSE listing style). */

const MULTI_LATIN: [string, string][] = [
    ['Dzh', 'Џ'],
    ['dzh', 'џ'],
    ['Zh', 'Ж'],
    ['zh', 'ж'],
    ['Ch', 'Ч'],
    ['ch', 'ч'],
    ['Sh', 'Ш'],
    ['sh', 'ш'],
    ['Nj', 'Њ'],
    ['nj', 'њ'],
    ['Lj', 'Љ'],
    ['lj', 'љ'],
    ['Kj', 'Ќ'],
    ['kj', 'ќ'],
    ['Gj', 'Ѓ'],
    ['gj', 'ѓ'],
    ['Dz', 'Ѕ'],
    ['dz', 'ѕ'],
]

const SINGLE_LATIN: Record<string, string> = {
    A: 'А',
    B: 'Б',
    C: 'Ц',
    D: 'Д',
    E: 'Е',
    F: 'Ф',
    G: 'Г',
    H: 'Х',
    I: 'И',
    J: 'Ј',
    K: 'К',
    L: 'Л',
    M: 'М',
    N: 'Н',
    O: 'О',
    P: 'П',
    Q: 'К',
    R: 'Р',
    S: 'С',
    T: 'Т',
    U: 'У',
    V: 'В',
    W: 'В',
    X: 'Кс',
    Y: 'Ј',
    Z: 'З',
    a: 'а',
    b: 'б',
    c: 'ц',
    d: 'д',
    e: 'е',
    f: 'ф',
    g: 'г',
    h: 'х',
    i: 'и',
    j: 'ј',
    k: 'к',
    l: 'л',
    m: 'м',
    n: 'н',
    o: 'о',
    p: 'п',
    q: 'к',
    r: 'р',
    s: 'с',
    t: 'т',
    u: 'у',
    v: 'в',
    w: 'в',
    x: 'кс',
    y: 'ј',
    z: 'з',
}

const PLACE_NAMES: Record<string, string> = {
    Skopje: 'Скопје',
    Prilep: 'Прилеп',
    Bitola: 'Битола',
    Tetovo: 'Тетово',
    Kavadarci: 'Кавадарци',
    Strumica: 'Струмица',
    Ohrid: 'Охрид',
    Debar: 'Дебар',
    Kumanovo: 'Куманово',
    Berovo: 'Берово',
    Nikole: 'Николе',
    Sveti: 'Свети',
    Veles: 'Велес',
    Gevgelija: 'Гевгелија',
    Stip: 'Штип',
    Kocani: 'Кочани',
    Radovis: 'Радовиш',
    Negotino: 'Неготино',
    Resen: 'Ресен',
}

export function issuerSlugFromLatinName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

export function latinToMacedonianCyrillic(name: string): string {
    if (!name) return ''

    let text = name.replace(/\s+/g, ' ').trim()
    text = text.replace(/\bAD\b/g, 'АД')

    for (const [latin, cyrillic] of Object.entries(PLACE_NAMES)) {
        text = text.replace(new RegExp(`\\b${latin}\\b`, 'g'), cyrillic)
    }

    let out = ''
    let index = 0
    while (index < text.length) {
        let matched = false
        for (const [latin, cyrillic] of MULTI_LATIN) {
            if (text.startsWith(latin, index)) {
                out += cyrillic
                index += latin.length
                matched = true
                break
            }
        }
        if (matched) continue

        const char = text[index]
        out += SINGLE_LATIN[char] ?? char
        index += 1
    }

    return out
}
