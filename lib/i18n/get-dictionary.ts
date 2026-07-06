import type { Locale } from './config'
import mk from '@/messages/mk.json'
import en from '@/messages/en.json'

export type Messages = typeof mk

const dictionaries: Record<Locale, Messages> = { mk, en }

export function getDictionary(locale: Locale): Messages {
    return dictionaries[locale] ?? dictionaries.mk
}

export type MessageKey = string

export function translate(messages: Messages, key: string): string {
    const parts = key.split('.')
    let node: unknown = messages
    for (const part of parts) {
        if (node === null || typeof node !== 'object' || !(part in (node as object))) {
            return key
        }
        node = (node as Record<string, unknown>)[part]
    }
    return typeof node === 'string' ? node : key
}
