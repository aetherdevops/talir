/** Localized HTML5 required messages (browser chrome often stays English despite lang=mk). */

export function clearCustomValidity(event: { currentTarget: HTMLInputElement }) {
    event.currentTarget.setCustomValidity('')
}

export function setRequiredCustomValidity(
    event: { currentTarget: HTMLInputElement },
    message: string
) {
    const el = event.currentTarget
    if (el.validity.valueMissing) {
        el.setCustomValidity(message)
    }
}

export function applyRequiredMessages(form: HTMLFormElement, message: string) {
    for (const el of Array.from(form.elements)) {
        if (!(el instanceof HTMLInputElement) || !el.required) continue
        el.setCustomValidity(el.value.trim() ? '' : message)
    }
}
