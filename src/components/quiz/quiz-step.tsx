'use client'

interface QuizOption {
  value: string
  label: string
  emoji: string
  sublabel?: string
}

interface QuizStepProps {
  question: string
  options: QuizOption[]
  onSelect: (value: string) => void
}

export function QuizStep({ question, options, onSelect }: QuizStepProps) {
  return (
    <div>
      <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">{question}</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-6 text-center transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-3xl leading-none">{option.emoji}</span>
            <span className="text-sm font-semibold leading-tight">{option.label}</span>
            {option.sublabel && (
              <span className="text-xs text-muted-foreground">{option.sublabel}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
