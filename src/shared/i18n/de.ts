export const DE = {
  tabs: {
    wochenplan: 'Wochenplan',
    einkaufsliste: 'Einkaufsliste',
    rezepte: 'Rezepte',
    einstellungen: 'Einstellungen',
  },
  mealPlan: {
    title: 'Wochenplan',
    regenerate: 'Neu generieren',
    generating: 'Wird erstellt...',
    weekPrefix: 'Woche vom',
  },
  shoppingList: {
    title: 'Einkaufsliste',
    itemsDone: (done: number, total: number) => `${done} von ${total} erledigt`,
    estimatedTotal: (euros: string) => `~${euros} €`,
  },
  placeholder: {
    comingSoon: 'Kommt bald',
    comingSoonSubtitle: 'Dieses Feature wird in einem späteren Update verfügbar sein.',
  },
  mealTypes: {
    Frühstück: 'Frühstück',
    Mittagessen: 'Mittagessen',
    Abendessen: 'Abendessen',
    Abendbrot: 'Abendbrot',
  },
  days: [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
    'Samstag',
    'Sonntag',
  ] as const,
  daysShort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const,
} as const;
