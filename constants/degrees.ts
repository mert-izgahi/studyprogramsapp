// constants/degrees.ts
// Single source of truth for degree labels + keywords
// Used by: DegreeFilterInput (UI), ProgramCard (display), program.service.ts (DB query)

export const DEGREE_OPTIONS = [
    {
        id:       'Bachelor',
        label:    'Bachelor',
        labelAr:  'بكالوريوس',
        keywords: ['bachelor'],
    },
    {
        id:       'Master',
        label:    'Master',
        labelAr:  'ماجستير',
        keywords: ['master'],
    },
    {
        id:       'Vocational School',
        label:    'Vocational School',
        labelAr:  'مدرسة مهنية',
        keywords: ['vocational'],
    },
    {
        id:       'PhD',
        label:    'PhD',
        labelAr:  'دكتوراه',
        keywords: ['phd', 'doctorate'],
    },
] as const

export type DegreeId = typeof DEGREE_OPTIONS[number]['id']

/** Derive a degree label from a program title */
export function getProgramDegree(programName: string, locale = 'en'): string {
    const title = programName.toLowerCase()
    const match = DEGREE_OPTIONS.find((d) =>
        d.keywords.some((kw) => title.includes(kw))
    )
    if (!match) return 'Unknown'
    return locale === 'ar' ? match.labelAr : match.label
}