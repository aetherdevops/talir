export function AboutSection() {
    const version = '0.1.0'
    return (
        <div className="space-y-3 text-sm text-text-secondary">
            <p>
                <span className="text-text-tertiary">Version </span>
                <span className="text-text-primary font-medium">{version}</span>
            </p>
            <p className="text-xs leading-relaxed">
                Talir tracks Macedonian Stock Exchange data for informational purposes only — not financial advice.
            </p>
            <ul className="text-xs space-y-1">
                <li>
                    <a href="https://github.com/aetherdevops/talir" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                        GitHub
                    </a>
                </li>
                <li>
                    <a href="https://www.mse.mk" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                        Macedonian Stock Exchange
                    </a>
                </li>
            </ul>
        </div>
    )
}
