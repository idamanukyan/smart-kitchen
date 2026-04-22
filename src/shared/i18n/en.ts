import type { Strings } from './de';

export const EN: Strings = {
  tabs: {
    wochenplan: 'Meal Plan',
    einkaufsliste: 'Shopping List',
    rezepte: 'Recipes',
    einstellungen: 'Settings',
  },
  mealPlan: {
    title: 'Meal Plan',
    regenerate: 'Regenerate',
    generating: 'Generating...',
    noRecipe: 'No recipe',
    minuteSuffix: 'min',
  },
  shoppingList: {
    title: 'Shopping List',
    empty: 'No shopping list available',
    itemsDone: (done: number, total: number) => `${done} of ${total} done`,
    estimatedTotal: (euros: string) => `~€${euros}`,
    package1: '1 package',
    packageN: (n: number) => `${n} packages`,
  },
  placeholder: {
    comingSoon: 'Coming soon',
    comingSoonSubtitle: 'This feature will be available in a future update.',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
  },
  recipe: {
    ingredients: 'Ingredients',
    instructions: 'Instructions',
    servings: (n: number) => `Serves ${n}`,
    difficulty: {
      einfach: 'Easy',
      mittel: 'Medium',
      anspruchsvoll: 'Advanced',
    },
    costRating: {
      günstig: 'Budget',
      mittel: 'Moderate',
      gehoben: 'Premium',
    },
  },
  mealTypes: {
    Frühstück: 'Breakfast',
    Mittagessen: 'Lunch',
    Abendessen: 'Dinner',
    Abendbrot: 'Light Dinner',
  },
  days: [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday',
    'Friday', 'Saturday', 'Sunday',
  ],
  daysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  monthsShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ],
  preferences: {
    householdSize: 'Household size',
    dietType: 'Diet',
    allergens: 'Allergies',
    cookingTime: 'Cooking time per day',
    store: 'Preferred store',
    unlimited: 'Unlimited',
    minutes: (n: number) => `≤${n} min`,
    person: (n: number) => n === 1 ? '1 person' : `${n} people`,
  },
  setup: {
    welcome: 'Welcome to SmartKüche',
    subtitle: 'Set up your preferences',
    done: 'Done',
  },
  dietTypes: {
    omnivor: 'Omnivore',
    flexitarisch: 'Flexitarian',
    vegetarisch: 'Vegetarian',
    vegan: 'Vegan',
    pescetarisch: 'Pescatarian',
  },
  allergenLabels: {
    Laktose: 'Lactose',
    Gluten: 'Gluten',
    Nüsse: 'Nuts',
    Erdnüsse: 'Peanuts',
    Ei: 'Egg',
    Soja: 'Soy',
    Fisch: 'Fish',
    Meeresfrüchte: 'Seafood',
    Sellerie: 'Celery',
    Senf: 'Mustard',
  },
  storeNames: {
    REWE: 'REWE',
    EDEKA: 'EDEKA',
    Lidl: 'Lidl',
    Aldi: 'Aldi',
    Kaufland: 'Kaufland',
    Other: 'Other',
  },
};
