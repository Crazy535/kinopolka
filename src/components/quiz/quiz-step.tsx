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
      <h2 className="mb-8 font-heading text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">
        {question}
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-5 text-left transition-all duration-150 hover:border-primary/30 hover:bg-surface-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-2xl leading-none">{option.emoji}</span>
            <div>
              <span className="block text-sm font-semibold leading-tight">{option.label}</span>
              {option.sublabel && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.sublabel}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
