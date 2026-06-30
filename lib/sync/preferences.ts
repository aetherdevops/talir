import type { SupabaseClient } from '@supabase/supabase-js'
import {
    DEFAULT_PREFERENCES,
    type UserPreferences,
} from '@/lib/stores/preferences'

export async function fetchPreferences(
    supabase: SupabaseClient,
    userId: string
): Promise<Partial<UserPreferences>> {
    const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single()

    if (error) throw error
    return (data?.preferences as Partial<UserPreferences>) ?? {}
}

export async function savePreferences(
    supabase: SupabaseClient,
    userId: string,
    preferences: UserPreferences
): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .update({ preferences })
        .eq('id', userId)

    if (error) throw error
}

export function mergePreferences(remote: Partial<UserPreferences>): UserPreferences {
    return { ...DEFAULT_PREFERENCES, ...remote }
}
