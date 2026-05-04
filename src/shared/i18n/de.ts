export interface Strings {
  tabs: {
    wochenplan: string;
    einkaufsliste: string;
    rezepte: string;
    einstellungen: string;
    vorräte: string;
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
    finishTrip: string;
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
  recipes: {
    title: string;
    searchPlaceholder: string;
    noResults: string;
  };
  dietTypes: Record<string, string>;
  allergenLabels: Record<string, string>;
  storeNames: Record<string, string>;
  pantry: {
    tab: string;
    title: string;
    emptyTitle: string;
    emptySubtitle: string;
    add: string;
    searchPlaceholder: string;
    expiresIn: (days: number) => string;
    expired: string;
    noExpiry: string;
    amount: string;
    unit: string;
    expiryDate: string;
    storageType: string;
    save: string;
    delete: string;
    deleteConfirm: string;
  };
  pantryImport: {
    title: string;
    confirm: string;
    subtitle: string;
  };
  consumption: {
    title: string;
    confirm: string;
    subtitle: string;
    currentPantry: string;
    toDeduct: string;
  };
  shoppingExpiry: {
    title: string;
    daysLeft: (days: number) => string;
  };
  mealSlot: {
    cooked: string;
  };
  storageTypes: Record<string, string>;
}

export const DE: Strings = {
  tabs: {
    wochenplan: 'Wochenplan',
    einkaufsliste: 'Einkaufsliste',
    rezepte: 'Rezepte',
    einstellungen: 'Einstellungen',
    vorräte: 'Vorräte',
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
    finishTrip: 'Einkauf abschließen',
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
  recipes: {
    title: 'Rezepte',
    searchPlaceholder: 'Rezept suchen...',
    noResults: 'Keine Rezepte gefunden',
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
  pantry: {
    tab: 'Vorräte',
    title: 'Vorratskammer',
    emptyTitle: 'Füge deine ersten Vorräte hinzu',
    emptySubtitle: 'Deine Vorratskammer hilft dir, Lebensmittelverschwendung zu reduzieren',
    add: 'Vorrat hinzufügen',
    searchPlaceholder: 'Zutat suchen…',
    expiresIn: (days: number) => days === 1 ? 'Läuft morgen ab' : `Läuft ab in ${days} Tagen`,
    expired: 'Abgelaufen',
    noExpiry: 'Kein Ablaufdatum',
    amount: 'Menge',
    unit: 'Einheit',
    expiryDate: 'Ablaufdatum',
    storageType: 'Lagerort',
    save: 'Speichern',
    delete: 'Löschen',
    deleteConfirm: 'Vorrat wirklich löschen?',
  },
  pantryImport: {
    title: 'Einkauf in Vorräte übernehmen?',
    confirm: 'In Vorräte übernehmen',
    subtitle: 'Gekaufte Artikel in deine Vorratskammer importieren',
  },
  consumption: {
    title: 'Verbrauch bestätigen',
    confirm: 'Verbrauch bestätigen',
    subtitle: 'Wie viel wurde für dieses Gericht verbraucht?',
    currentPantry: 'Im Vorrat',
    toDeduct: 'Verbrauch',
  },
  shoppingExpiry: {
    title: 'Bald ablaufend',
    daysLeft: (days: number) => days <= 0 ? 'Abgelaufen' : days === 1 ? 'Morgen' : `${days} Tage`,
  },
  mealSlot: {
    cooked: 'Gekocht',
  },
  storageTypes: {
    Kühlschrank: 'Kühlschrank',
    Tiefkühler: 'Tiefkühler',
    Vorratskammer: 'Vorratskammer',
    Raumtemperatur: 'Raumtemperatur',
  },
};
