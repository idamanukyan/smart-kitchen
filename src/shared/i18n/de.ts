export interface Strings {
  tabs: {
    wochenplan: string;
    einkaufsliste: string;
    rezepte: string;
    einstellungen: string;
  };
  mealPlan: {
    title: string;
    regenerate: string;
    generating: string;
    noRecipe: string;
    minuteSuffix: string;
  };
  shoppingList: {
    title: string;
    empty: string;
    itemsDone: (done: number, total: number) => string;
    estimatedTotal: (euros: string) => string;
    package1: string;
    packageN: (n: number) => string;
  };
  placeholder: {
    comingSoon: string;
    comingSoonSubtitle: string;
  };
  settings: {
    title: string;
    language: string;
  };
  recipe: {
    ingredients: string;
    instructions: string;
    servings: (n: number) => string;
    difficulty: Record<string, string>;
    costRating: Record<string, string>;
  };
  mealTypes: Record<string, string>;
  days: readonly [string, string, string, string, string, string, string];
  daysShort: readonly [string, string, string, string, string, string, string];
  months: readonly [string, string, string, string, string, string, string, string, string, string, string, string];
  monthsShort: readonly [string, string, string, string, string, string, string, string, string, string, string, string];
  preferences: {
    householdSize: string;
    dietType: string;
    allergens: string;
    cookingTime: string;
    store: string;
    unlimited: string;
    minutes: (n: number) => string;
    person: (n: number) => string;
  };
  setup: {
    welcome: string;
    subtitle: string;
    done: string;
  };
  dietTypes: Record<string, string>;
  allergenLabels: Record<string, string>;
  storeNames: Record<string, string>;
}

export const DE: Strings = {
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
    noRecipe: 'Kein Rezept',
    minuteSuffix: 'Min',
  },
  shoppingList: {
    title: 'Einkaufsliste',
    empty: 'Keine Einkaufsliste vorhanden',
    itemsDone: (done: number, total: number) => `${done} von ${total} erledigt`,
    estimatedTotal: (euros: string) => `~${euros} €`,
    package1: '1 Packung',
    packageN: (n: number) => `${n} Packungen`,
  },
  placeholder: {
    comingSoon: 'Kommt bald',
    comingSoonSubtitle: 'Dieses Feature wird in einem späteren Update verfügbar sein.',
  },
  settings: {
    title: 'Einstellungen',
    language: 'Sprache',
  },
  recipe: {
    ingredients: 'Zutaten',
    instructions: 'Zubereitung',
    servings: (n: number) => `Für ${n} Portionen`,
    difficulty: {
      einfach: 'Einfach',
      mittel: 'Mittel',
      anspruchsvoll: 'Anspruchsvoll',
    },
    costRating: {
      günstig: 'Günstig',
      mittel: 'Mittel',
      gehoben: 'Gehoben',
    },
  },
  mealTypes: {
    Frühstück: 'Frühstück',
    Mittagessen: 'Mittagessen',
    Abendessen: 'Abendessen',
    Abendbrot: 'Abendbrot',
  },
  days: [
    'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag',
    'Freitag', 'Samstag', 'Sonntag',
  ],
  daysShort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  months: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ],
  monthsShort: [
    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
  ],
  preferences: {
    householdSize: 'Haushaltsgröße',
    dietType: 'Ernährungsweise',
    allergens: 'Unverträglichkeiten',
    cookingTime: 'Kochzeit pro Tag',
    store: 'Bevorzugter Supermarkt',
    unlimited: 'Unbegrenzt',
    minutes: (n: number) => `≤${n} Min`,
    person: (n: number) => n === 1 ? '1 Person' : `${n} Personen`,
  },
  setup: {
    welcome: 'Willkommen bei SmartKüche',
    subtitle: 'Richte deine Präferenzen ein',
    done: 'Fertig',
  },
  dietTypes: {
    omnivor: 'Omnivor',
    flexitarisch: 'Flexitarisch',
    vegetarisch: 'Vegetarisch',
    vegan: 'Vegan',
    pescetarisch: 'Pescetarisch',
  },
  allergenLabels: {
    Laktose: 'Laktose',
    Gluten: 'Gluten',
    Nüsse: 'Nüsse',
    Erdnüsse: 'Erdnüsse',
    Ei: 'Ei',
    Soja: 'Soja',
    Fisch: 'Fisch',
    Meeresfrüchte: 'Meeresfrüchte',
    Sellerie: 'Sellerie',
    Senf: 'Senf',
  },
  storeNames: {
    REWE: 'REWE',
    EDEKA: 'EDEKA',
    Lidl: 'Lidl',
    Aldi: 'Aldi',
    Kaufland: 'Kaufland',
    Other: 'Andere',
  },
};
