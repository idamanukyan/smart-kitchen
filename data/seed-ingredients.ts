type AisleCategory =
  | 'Obst & Gemüse'
  | 'Fleisch & Wurst'
  | 'Milchprodukte'
  | 'Kühlregal'
  | 'Tiefkühl'
  | 'Konserven & Gläser'
  | 'Backzutaten'
  | 'Gewürze & Öle'
  | 'Getränke'
  | 'Brot & Backwaren'
  | 'Süßwaren & Snacks'
  | 'Trockenwaren & Beilagen'
  | 'Sonstiges';

type UnitType =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'Stück'
  | 'Bund'
  | 'Packung'
  | 'Dose'
  | 'Becher'
  | 'Tüte';

type StorageType = 'Kühlschrank' | 'Tiefkühler' | 'Vorratskammer' | 'Raumtemperatur';

interface PackageSize {
  size: number;
  unit: string;
  price_cents: number;
}

interface Ingredient {
  name_de: string;
  category: AisleCategory;
  default_unit: UnitType;
  common_package_sizes: PackageSize[];
  shelf_life_days: number;
  storage_type: StorageType;
  is_seasonal: boolean;
  season_months?: number[];
}

export const SEED_INGREDIENTS: Ingredient[] = [
  // ─── Obst & Gemüse ────────────────────────────────────────────────────────

  {
    name_de: 'Kartoffeln',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 1, unit: 'kg', price_cents: 119 },
      { size: 2.5, unit: 'kg', price_cents: 249 },
      { size: 5, unit: 'kg', price_cents: 399 },
    ],
    shelf_life_days: 30,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Zwiebeln',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 1, unit: 'kg', price_cents: 99 },
      { size: 2, unit: 'kg', price_cents: 179 },
    ],
    shelf_life_days: 30,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Möhren',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 89 },
      { size: 1, unit: 'kg', price_cents: 149 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Paprika rot',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 3, unit: 'Stück', price_cents: 199 },
      { size: 1, unit: 'Stück', price_cents: 89 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [6, 7, 8, 9, 10],
  },
  {
    name_de: 'Paprika gelb',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 3, unit: 'Stück', price_cents: 199 },
      { size: 1, unit: 'Stück', price_cents: 89 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [6, 7, 8, 9, 10],
  },
  {
    name_de: 'Paprika grün',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 3, unit: 'Stück', price_cents: 179 },
      { size: 1, unit: 'Stück', price_cents: 69 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [6, 7, 8, 9, 10],
  },
  {
    name_de: 'Tomaten',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 149 },
      { size: 1, unit: 'kg', price_cents: 249 },
    ],
    shelf_life_days: 5,
    storage_type: 'Raumtemperatur',
    is_seasonal: true,
    season_months: [6, 7, 8, 9, 10],
  },
  {
    name_de: 'Rispentomaten',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 169 },
      { size: 1, unit: 'kg', price_cents: 299 },
    ],
    shelf_life_days: 5,
    storage_type: 'Raumtemperatur',
    is_seasonal: true,
    season_months: [6, 7, 8, 9, 10],
  },
  {
    name_de: 'Cherrytomaten',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 149 },
      { size: 500, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 5,
    storage_type: 'Raumtemperatur',
    is_seasonal: true,
    season_months: [5, 6, 7, 8, 9, 10],
  },
  {
    name_de: 'Salatgurke',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 79 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [5, 6, 7, 8, 9],
  },
  {
    name_de: 'Zucchini',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 89 },
      { size: 2, unit: 'Stück', price_cents: 149 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [5, 6, 7, 8, 9, 10],
  },
  {
    name_de: 'Brokkoli',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 149 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Blumenkohl',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 169 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [3, 4, 5, 9, 10, 11],
  },
  {
    name_de: 'Spinat',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 189 },
      { size: 500, unit: 'g', price_cents: 299 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [3, 4, 5, 9, 10, 11],
  },
  {
    name_de: 'Champignons',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 169 },
      { size: 500, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Knoblauch',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 3, unit: 'Stück', price_cents: 79 },
    ],
    shelf_life_days: 30,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Lauch',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 99 },
      { size: 2, unit: 'Stück', price_cents: 179 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [9, 10, 11, 12, 1, 2, 3],
  },
  {
    name_de: 'Kohlrabi',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 89 },
    ],
    shelf_life_days: 10,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [4, 5, 6, 7, 8],
  },
  {
    name_de: 'Weißkohl',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 129 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [9, 10, 11, 12, 1, 2],
  },
  {
    name_de: 'Rotkohl',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 129 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [9, 10, 11, 12, 1, 2],
  },
  {
    name_de: 'Eisbergsalat',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 109 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Feldsalat',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 100, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [9, 10, 11, 12, 1, 2, 3],
  },
  {
    name_de: 'Rucola',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 75, unit: 'g', price_cents: 129 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Frühlingszwiebeln',
    category: 'Obst & Gemüse',
    default_unit: 'Bund',
    common_package_sizes: [
      { size: 1, unit: 'Bund', price_cents: 79 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Petersilie',
    category: 'Obst & Gemüse',
    default_unit: 'Bund',
    common_package_sizes: [
      { size: 1, unit: 'Bund', price_cents: 69 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Basilikum',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Topf', price_cents: 149 },
      { size: 15, unit: 'g', price_cents: 99 },
    ],
    shelf_life_days: 7,
    storage_type: 'Raumtemperatur',
    is_seasonal: true,
    season_months: [4, 5, 6, 7, 8, 9, 10],
  },
  {
    name_de: 'Schnittlauch',
    category: 'Obst & Gemüse',
    default_unit: 'Bund',
    common_package_sizes: [
      { size: 1, unit: 'Bund', price_cents: 69 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Äpfel',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 1, unit: 'kg', price_cents: 199 },
      { size: 2, unit: 'kg', price_cents: 349 },
    ],
    shelf_life_days: 21,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [8, 9, 10, 11, 12, 1, 2, 3],
  },
  {
    name_de: 'Bananen',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 1, unit: 'kg', price_cents: 169 },
    ],
    shelf_life_days: 5,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Zitronen',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 4, unit: 'Stück', price_cents: 129 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Orangen',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 1, unit: 'kg', price_cents: 199 },
      { size: 2, unit: 'kg', price_cents: 349 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [11, 12, 1, 2, 3, 4],
  },
  {
    name_de: 'Erdbeeren',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 299 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [5, 6, 7],
  },
  {
    name_de: 'Trauben',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 199 },
      { size: 1, unit: 'kg', price_cents: 349 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [8, 9, 10, 11],
  },
  {
    name_de: 'Birnen',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 1, unit: 'kg', price_cents: 199 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [8, 9, 10, 11],
  },
  {
    name_de: 'Heidelbeeren',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 125, unit: 'g', price_cents: 169 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [6, 7, 8],
  },
  {
    name_de: 'Avocado',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 129 },
      { size: 2, unit: 'Stück', price_cents: 219 },
    ],
    shelf_life_days: 3,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Süßkartoffeln',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 149 },
      { size: 1, unit: 'kg', price_cents: 249 },
    ],
    shelf_life_days: 14,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Aubergine',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 129 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [6, 7, 8, 9, 10],
  },
  {
    name_de: 'Sellerie',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 179 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [9, 10, 11, 12, 1, 2, 3],
  },
  {
    name_de: 'Pastinaken',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 129 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [9, 10, 11, 12, 1, 2, 3],
  },
  {
    name_de: 'Kürbis',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 299 },
      { size: 500, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 60,
    storage_type: 'Vorratskammer',
    is_seasonal: true,
    season_months: [9, 10, 11, 12],
  },
  {
    name_de: 'Grüne Bohnen',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 4,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [6, 7, 8, 9],
  },
  {
    name_de: 'Erbsen frisch',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 229 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [5, 6, 7],
  },
  {
    name_de: 'Maiskolben',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 99 },
      { size: 2, unit: 'Stück', price_cents: 179 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [7, 8, 9],
  },
  {
    name_de: 'Spargel weiß',
    category: 'Obst & Gemüse',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 499 },
      { size: 1, unit: 'kg', price_cents: 899 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [4, 5, 6],
  },
  {
    name_de: 'Spargel grün',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 349 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [4, 5, 6],
  },
  {
    name_de: 'Radieschen',
    category: 'Obst & Gemüse',
    default_unit: 'Bund',
    common_package_sizes: [
      { size: 1, unit: 'Bund', price_cents: 69 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [3, 4, 5, 6, 7, 8, 9, 10],
  },
  {
    name_de: 'Rote Bete',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 129 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [8, 9, 10, 11, 12],
  },
  {
    name_de: 'Ingwer',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 100, unit: 'g', price_cents: 79 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Limetten',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 5, unit: 'Stück', price_cents: 139 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Mango',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 179 },
    ],
    shelf_life_days: 3,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Ananas',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 199 },
    ],
    shelf_life_days: 5,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Kiwis',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 5, unit: 'Stück', price_cents: 149 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [11, 12, 1, 2, 3, 4],
  },
  {
    name_de: 'Dill',
    category: 'Obst & Gemüse',
    default_unit: 'Bund',
    common_package_sizes: [
      { size: 1, unit: 'Bund', price_cents: 69 },
    ],
    shelf_life_days: 4,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Thymian frisch',
    category: 'Obst & Gemüse',
    default_unit: 'Bund',
    common_package_sizes: [
      { size: 1, unit: 'Bund', price_cents: 79 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Rosenkohl',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [10, 11, 12, 1, 2],
  },

  // ─── Fleisch & Wurst ──────────────────────────────────────────────────────

  {
    name_de: 'Hackfleisch gemischt',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 279 },
      { size: 500, unit: 'g', price_cents: 339 },
    ],
    shelf_life_days: 2,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Rinderhack',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 429 },
    ],
    shelf_life_days: 2,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Hähnchenbrust',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 349 },
      { size: 600, unit: 'g', price_cents: 499 },
    ],
    shelf_life_days: 2,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Hähnchenschenkel',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 1000, unit: 'g', price_cents: 399 },
    ],
    shelf_life_days: 2,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Schweinefilet',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 479 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Schweinegeschnetzeltes',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 349 },
    ],
    shelf_life_days: 2,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Rindersteak',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 399 },
      { size: 400, unit: 'g', price_cents: 749 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Rindergulasch',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 599 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Lammhack',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 529 },
    ],
    shelf_life_days: 2,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Bratwurst',
    category: 'Fleisch & Wurst',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 5, unit: 'Stück', price_cents: 299 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Speck / Bacon',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 150, unit: 'g', price_cents: 199 },
      { size: 300, unit: 'g', price_cents: 349 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Salami',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 100, unit: 'g', price_cents: 139 },
      { size: 200, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 21,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Kochschinken',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 100, unit: 'g', price_cents: 129 },
      { size: 200, unit: 'g', price_cents: 229 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Fleischwurst',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 169 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Chorizo',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 21,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Putengeschnetzeltes',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 369 },
    ],
    shelf_life_days: 2,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Kasseler',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 299 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Leberwurst',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Schwarzwälder Schinken',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 100, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 21,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Lachsschinken',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 80, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Geflügelaufschnitt',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 150, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },

  // ─── Milchprodukte ────────────────────────────────────────────────────────

  {
    name_de: 'Vollmilch',
    category: 'Milchprodukte',
    default_unit: 'l',
    common_package_sizes: [
      { size: 1, unit: 'l', price_cents: 119 },
      { size: 1.5, unit: 'l', price_cents: 169 },
    ],
    shelf_life_days: 10,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Fettarme Milch',
    category: 'Milchprodukte',
    default_unit: 'l',
    common_package_sizes: [
      { size: 1, unit: 'l', price_cents: 109 },
    ],
    shelf_life_days: 10,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Butter',
    category: 'Milchprodukte',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 189 },
    ],
    shelf_life_days: 30,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Schlagsahne',
    category: 'Milchprodukte',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 200, unit: 'ml', price_cents: 149 },
      { size: 500, unit: 'ml', price_cents: 309 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Schmand',
    category: 'Milchprodukte',
    default_unit: 'Becher',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 109 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Crème fraîche',
    category: 'Milchprodukte',
    default_unit: 'Becher',
    common_package_sizes: [
      { size: 150, unit: 'g', price_cents: 119 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Magerquark',
    category: 'Milchprodukte',
    default_unit: 'Becher',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 79 },
      { size: 500, unit: 'g', price_cents: 139 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Naturjoghurt',
    category: 'Milchprodukte',
    default_unit: 'Becher',
    common_package_sizes: [
      { size: 150, unit: 'g', price_cents: 49 },
      { size: 500, unit: 'g', price_cents: 109 },
    ],
    shelf_life_days: 21,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Griechischer Joghurt',
    category: 'Milchprodukte',
    default_unit: 'Becher',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 129 },
      { size: 500, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 21,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Eier',
    category: 'Milchprodukte',
    default_unit: 'Packung',
    common_package_sizes: [
      { size: 6, unit: 'Stück', price_cents: 189 },
      { size: 10, unit: 'Stück', price_cents: 299 },
    ],
    shelf_life_days: 28,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Gouda',
    category: 'Milchprodukte',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 179 },
      { size: 400, unit: 'g', price_cents: 319 },
    ],
    shelf_life_days: 21,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Edamer',
    category: 'Milchprodukte',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 169 },
    ],
    shelf_life_days: 21,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Emmentaler',
    category: 'Milchprodukte',
    default_unit: 'g',
    common_package_sizes: [
      { size: 150, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 21,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Parmesan',
    category: 'Milchprodukte',
    default_unit: 'g',
    common_package_sizes: [
      { size: 80, unit: 'g', price_cents: 179 },
      { size: 200, unit: 'g', price_cents: 379 },
    ],
    shelf_life_days: 30,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Mozzarella',
    category: 'Milchprodukte',
    default_unit: 'g',
    common_package_sizes: [
      { size: 125, unit: 'g', price_cents: 89 },
      { size: 250, unit: 'g', price_cents: 159 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Feta',
    category: 'Milchprodukte',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 21,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Frischkäse Natur',
    category: 'Milchprodukte',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 129 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Buttermilch',
    category: 'Milchprodukte',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 500, unit: 'ml', price_cents: 89 },
      { size: 1000, unit: 'ml', price_cents: 149 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Sauerrahm',
    category: 'Milchprodukte',
    default_unit: 'Becher',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 109 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Kefir',
    category: 'Milchprodukte',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 500, unit: 'ml', price_cents: 99 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },

  // ─── Kühlregal ────────────────────────────────────────────────────────────

  {
    name_de: 'Tofu Natur',
    category: 'Kühlregal',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 169 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Räucherlachs',
    category: 'Kühlregal',
    default_unit: 'g',
    common_package_sizes: [
      { size: 100, unit: 'g', price_cents: 249 },
      { size: 200, unit: 'g', price_cents: 449 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Frische Pasta Tagliatelle',
    category: 'Kühlregal',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 189 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Blätterteig',
    category: 'Kühlregal',
    default_unit: 'Packung',
    common_package_sizes: [
      { size: 270, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Pizzateig fertig',
    category: 'Kühlregal',
    default_unit: 'Packung',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 139 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Tempeh',
    category: 'Kühlregal',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Garnelen gekocht',
    category: 'Kühlregal',
    default_unit: 'g',
    common_package_sizes: [
      { size: 150, unit: 'g', price_cents: 299 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Frischer Lachs',
    category: 'Kühlregal',
    default_unit: 'g',
    common_package_sizes: [
      { size: 300, unit: 'g', price_cents: 449 },
    ],
    shelf_life_days: 2,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Seelachsfilet',
    category: 'Kühlregal',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 349 },
    ],
    shelf_life_days: 2,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Frischer Ricotta',
    category: 'Kühlregal',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Hummus',
    category: 'Kühlregal',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },

  // ─── Tiefkühl ─────────────────────────────────────────────────────────────

  {
    name_de: 'TK-Erbsen',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 450, unit: 'g', price_cents: 139 },
      { size: 1000, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },
  {
    name_de: 'TK-Spinat',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 450, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },
  {
    name_de: 'TK-Brokkoli',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 450, unit: 'g', price_cents: 149 },
      { size: 1000, unit: 'g', price_cents: 279 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },
  {
    name_de: 'TK-Pizza Margherita',
    category: 'Tiefkühl',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 189 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },
  {
    name_de: 'TK-Pommes frites',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 600, unit: 'g', price_cents: 169 },
      { size: 1200, unit: 'g', price_cents: 279 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },
  {
    name_de: 'TK-Garnelen',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 300, unit: 'g', price_cents: 399 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },
  {
    name_de: 'TK-Fischstäbchen',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },
  {
    name_de: 'TK-Hähnchennuggets',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 299 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },
  {
    name_de: 'TK-Beerenmischung',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 199 },
      { size: 1000, unit: 'g', price_cents: 349 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },
  {
    name_de: 'TK-Maultaschen',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 279 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },
  {
    name_de: 'TK-Lachs Filet',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 499 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },
  {
    name_de: 'TK-Rahmspinat',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 450, unit: 'g', price_cents: 169 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },

  // ─── Konserven & Gläser ───────────────────────────────────────────────────

  {
    name_de: 'Dose Tomaten gehackt',
    category: 'Konserven & Gläser',
    default_unit: 'Dose',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 79 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Passierte Tomaten',
    category: 'Konserven & Gläser',
    default_unit: 'Packung',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Dose Kichererbsen',
    category: 'Konserven & Gläser',
    default_unit: 'Dose',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 99 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Kokosmilch',
    category: 'Konserven & Gläser',
    default_unit: 'Dose',
    common_package_sizes: [
      { size: 400, unit: 'ml', price_cents: 139 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Dose Mais',
    category: 'Konserven & Gläser',
    default_unit: 'Dose',
    common_package_sizes: [
      { size: 285, unit: 'g', price_cents: 79 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Dose Thunfisch in Wasser',
    category: 'Konserven & Gläser',
    default_unit: 'Dose',
    common_package_sizes: [
      { size: 185, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 1460,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Dose Kidneybohnen',
    category: 'Konserven & Gläser',
    default_unit: 'Dose',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Dose weiße Bohnen',
    category: 'Konserven & Gläser',
    default_unit: 'Dose',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Dose Linsen',
    category: 'Konserven & Gläser',
    default_unit: 'Dose',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 99 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Tomatenpüree (Tomatenmark)',
    category: 'Konserven & Gläser',
    default_unit: 'g',
    common_package_sizes: [
      { size: 70, unit: 'g', price_cents: 49 },
      { size: 200, unit: 'g', price_cents: 99 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Pesto Basilikum',
    category: 'Konserven & Gläser',
    default_unit: 'g',
    common_package_sizes: [
      { size: 190, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Oliven grün entkernt',
    category: 'Konserven & Gläser',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 169 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Kapern',
    category: 'Konserven & Gläser',
    default_unit: 'g',
    common_package_sizes: [
      { size: 100, unit: 'g', price_cents: 99 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Sardinen in Öl',
    category: 'Konserven & Gläser',
    default_unit: 'Dose',
    common_package_sizes: [
      { size: 125, unit: 'g', price_cents: 139 },
    ],
    shelf_life_days: 1460,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Gurkengläser',
    category: 'Konserven & Gläser',
    default_unit: 'g',
    common_package_sizes: [
      { size: 720, unit: 'ml', price_cents: 199 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Rotkohl aus dem Glas',
    category: 'Konserven & Gläser',
    default_unit: 'g',
    common_package_sizes: [
      { size: 720, unit: 'ml', price_cents: 149 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },

  // ─── Backzutaten ──────────────────────────────────────────────────────────

  {
    name_de: 'Weizenmehl Type 405',
    category: 'Backzutaten',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 1, unit: 'kg', price_cents: 89 },
      { size: 2.5, unit: 'kg', price_cents: 199 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Weizenmehl Type 550',
    category: 'Backzutaten',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 1, unit: 'kg', price_cents: 99 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Zucker',
    category: 'Backzutaten',
    default_unit: 'kg',
    common_package_sizes: [
      { size: 1, unit: 'kg', price_cents: 119 },
    ],
    shelf_life_days: 1460,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Puderzucker',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 89 },
      { size: 500, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 1460,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Braune Zucker',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 1460,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Trockenhefe',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 7, unit: 'g', price_cents: 29 },
      { size: 21, unit: 'g', price_cents: 69 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Frische Hefe',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 42, unit: 'g', price_cents: 39 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Backpulver',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 16, unit: 'g', price_cents: 29 },
      { size: 5, unit: 'Stück', price_cents: 59 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Vanillezucker',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 8, unit: 'g', price_cents: 29 },
      { size: 5, unit: 'Stück', price_cents: 79 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Kakao Pulver',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 125, unit: 'g', price_cents: 149 },
      { size: 250, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Schokolade Zartbitter',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 100, unit: 'g', price_cents: 89 },
      { size: 200, unit: 'g', price_cents: 169 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Haferflocken',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 99 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Mandeln gemahlen',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Rosinen',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 119 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Speisestärke',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Honig',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 199 },
      { size: 500, unit: 'g', price_cents: 349 },
    ],
    shelf_life_days: 1460,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },

  // ─── Gewürze & Öle ────────────────────────────────────────────────────────

  {
    name_de: 'Olivenöl',
    category: 'Gewürze & Öle',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 500, unit: 'ml', price_cents: 399 },
      { size: 750, unit: 'ml', price_cents: 549 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Sonnenblumenöl',
    category: 'Gewürze & Öle',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 750, unit: 'ml', price_cents: 199 },
      { size: 1000, unit: 'ml', price_cents: 249 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Rapsöl',
    category: 'Gewürze & Öle',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 750, unit: 'ml', price_cents: 189 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Salz',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 39 },
      { size: 1000, unit: 'g', price_cents: 59 },
    ],
    shelf_life_days: 3650,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Schwarzer Pfeffer gemahlen',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 50, unit: 'g', price_cents: 139 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Paprikapulver edelsüß',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 50, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Paprikapulver scharf',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 50, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Kreuzkümmel gemahlen',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 40, unit: 'g', price_cents: 99 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Oregano getrocknet',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 10, unit: 'g', price_cents: 69 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Thymian getrocknet',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 10, unit: 'g', price_cents: 69 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Lorbeerblätter',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 5, unit: 'g', price_cents: 59 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Zimt gemahlen',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 40, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Muskat gemahlen',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 30, unit: 'g', price_cents: 99 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Curry Pulver',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 50, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Kurkuma gemahlen',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 40, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Rosmarin getrocknet',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 10, unit: 'g', price_cents: 69 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Chilipulver',
    category: 'Gewürze & Öle',
    default_unit: 'g',
    common_package_sizes: [
      { size: 40, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Weißweinessig',
    category: 'Gewürze & Öle',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 500, unit: 'ml', price_cents: 89 },
    ],
    shelf_life_days: 1460,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Apfelessig',
    category: 'Gewürze & Öle',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 500, unit: 'ml', price_cents: 99 },
    ],
    shelf_life_days: 1460,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Balsamico Essig',
    category: 'Gewürze & Öle',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 250, unit: 'ml', price_cents: 199 },
    ],
    shelf_life_days: 1460,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },

  // ─── Trockenwaren & Beilagen ──────────────────────────────────────────────

  {
    name_de: 'Spaghetti',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 89 },
      { size: 1000, unit: 'g', price_cents: 169 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Penne',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Fusilli',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Rigatoni',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 99 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Lasagneplatten',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 99 },
      { size: 500, unit: 'g', price_cents: 169 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Langkornreis',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 99 },
      { size: 1000, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Basmati Reis',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Risotto Reis',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Couscous',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 129 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Bulgur',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 129 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Rote Linsen',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Grüne Linsen',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Kichererbsen trocken',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 139 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Quinoa',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 279 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Buchweizen',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Hirse',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Glasnudeln',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Reisnudeln',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Eiernudeln',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 89 },
      { size: 500, unit: 'g', price_cents: 159 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Cornflakes',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 375, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Paniermehl',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 400, unit: 'g', price_cents: 79 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },

  // ─── Brot & Backwaren ─────────────────────────────────────────────────────

  {
    name_de: 'Vollkornbrot',
    category: 'Brot & Backwaren',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 7,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Toastbrot',
    category: 'Brot & Backwaren',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 139 },
    ],
    shelf_life_days: 7,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Brötchen',
    category: 'Brot & Backwaren',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 6, unit: 'Stück', price_cents: 149 },
    ],
    shelf_life_days: 2,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Baguette',
    category: 'Brot & Backwaren',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 99 },
    ],
    shelf_life_days: 1,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Ciabatta',
    category: 'Brot & Backwaren',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 149 },
    ],
    shelf_life_days: 2,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Graubrot',
    category: 'Brot & Backwaren',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 159 },
    ],
    shelf_life_days: 5,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Laugenbrezel',
    category: 'Brot & Backwaren',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 79 },
    ],
    shelf_life_days: 1,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Knäckebrot',
    category: 'Brot & Backwaren',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 180,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Pita Brot',
    category: 'Brot & Backwaren',
    default_unit: 'Packung',
    common_package_sizes: [
      { size: 4, unit: 'Stück', price_cents: 129 },
    ],
    shelf_life_days: 5,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Weizentortilla',
    category: 'Brot & Backwaren',
    default_unit: 'Packung',
    common_package_sizes: [
      { size: 6, unit: 'Stück', price_cents: 149 },
    ],
    shelf_life_days: 14,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },
  {
    name_de: 'Mischbrot',
    category: 'Brot & Backwaren',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 169 },
    ],
    shelf_life_days: 5,
    storage_type: 'Raumtemperatur',
    is_seasonal: false,
  },

  // ─── Getränke ─────────────────────────────────────────────────────────────

  {
    name_de: 'Gemüsebrühe',
    category: 'Getränke',
    default_unit: 'l',
    common_package_sizes: [
      { size: 1, unit: 'l', price_cents: 99 },
      { size: 6, unit: 'Stück', price_cents: 119 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Hühnerbrühe',
    category: 'Getränke',
    default_unit: 'l',
    common_package_sizes: [
      { size: 1, unit: 'l', price_cents: 109 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Rinderbrühe',
    category: 'Getränke',
    default_unit: 'l',
    common_package_sizes: [
      { size: 1, unit: 'l', price_cents: 119 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Sojasauce',
    category: 'Getränke',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 150, unit: 'ml', price_cents: 139 },
      { size: 250, unit: 'ml', price_cents: 199 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Kokoswasser',
    category: 'Getränke',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 500, unit: 'ml', price_cents: 179 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Rotwein zum Kochen',
    category: 'Getränke',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 750, unit: 'ml', price_cents: 399 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Weißwein zum Kochen',
    category: 'Getränke',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 750, unit: 'ml', price_cents: 349 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },

  // ─── Süßwaren & Snacks ────────────────────────────────────────────────────

  {
    name_de: 'Walnüsse',
    category: 'Süßwaren & Snacks',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 180,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Haselnüsse',
    category: 'Süßwaren & Snacks',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 189 },
    ],
    shelf_life_days: 180,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Cashewkerne',
    category: 'Süßwaren & Snacks',
    default_unit: 'g',
    common_package_sizes: [
      { size: 150, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 180,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Erdnüsse geröstet',
    category: 'Süßwaren & Snacks',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 139 },
    ],
    shelf_life_days: 180,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Kürbiskerne',
    category: 'Süßwaren & Snacks',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 180,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Sonnenblumenkerne',
    category: 'Süßwaren & Snacks',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 99 },
    ],
    shelf_life_days: 180,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Pinienkerne',
    category: 'Süßwaren & Snacks',
    default_unit: 'g',
    common_package_sizes: [
      { size: 50, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 180,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },

  // ─── Sonstiges ────────────────────────────────────────────────────────────

  {
    name_de: 'Senf mittelscharf',
    category: 'Sonstiges',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 89 },
    ],
    shelf_life_days: 730,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Ketchup',
    category: 'Sonstiges',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 129 },
    ],
    shelf_life_days: 365,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Mayonnaise',
    category: 'Sonstiges',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 149 },
      { size: 500, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 90,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Erdnussbutter',
    category: 'Sonstiges',
    default_unit: 'g',
    common_package_sizes: [
      { size: 350, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Tahini',
    category: 'Sonstiges',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 299 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Worcestershire Sauce',
    category: 'Sonstiges',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 150, unit: 'ml', price_cents: 199 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Tabasco',
    category: 'Sonstiges',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 60, unit: 'ml', price_cents: 199 },
    ],
    shelf_life_days: 1460,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Fischsauce',
    category: 'Sonstiges',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 200, unit: 'ml', price_cents: 199 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Austernsauce',
    category: 'Sonstiges',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 255, unit: 'ml', price_cents: 199 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },

  // ─── Additional Backzutaten ───────────────────────────────────────────────

  {
    name_de: 'Natron',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 49 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Weinstein Backpulver',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 5, unit: 'Stück', price_cents: 69 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Mandelblättchen',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 100, unit: 'g', price_cents: 149 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Kokosflocken',
    category: 'Backzutaten',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 129 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },

  // ─── Additional Getränke ──────────────────────────────────────────────────

  {
    name_de: 'Tomatenmark Konzentrat',
    category: 'Getränke',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 500, unit: 'ml', price_cents: 89 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Sesamöl',
    category: 'Gewürze & Öle',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 250, unit: 'ml', price_cents: 299 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },

  // ─── Additional Süßwaren & Snacks ─────────────────────────────────────────

  {
    name_de: 'Mandeln ganz',
    category: 'Süßwaren & Snacks',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 180,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Sesam',
    category: 'Süßwaren & Snacks',
    default_unit: 'g',
    common_package_sizes: [
      { size: 100, unit: 'g', price_cents: 99 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Chiasamen',
    category: 'Süßwaren & Snacks',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Leinsamen',
    category: 'Süßwaren & Snacks',
    default_unit: 'g',
    common_package_sizes: [
      { size: 250, unit: 'g', price_cents: 129 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Reiswaffeln',
    category: 'Süßwaren & Snacks',
    default_unit: 'g',
    common_package_sizes: [
      { size: 100, unit: 'g', price_cents: 99 },
    ],
    shelf_life_days: 180,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },

  // ─── Additional Sonstiges ─────────────────────────────────────────────────

  {
    name_de: 'Sriracha Sauce',
    category: 'Sonstiges',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 250, unit: 'ml', price_cents: 249 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Harissa Paste',
    category: 'Sonstiges',
    default_unit: 'g',
    common_package_sizes: [
      { size: 125, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 365,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Miso Paste',
    category: 'Sonstiges',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 299 },
    ],
    shelf_life_days: 365,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Dijon Senf',
    category: 'Sonstiges',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 730,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },

  // ─── Additional Kühlregal ─────────────────────────────────────────────────

  {
    name_de: 'Quorn Hack',
    category: 'Kühlregal',
    default_unit: 'g',
    common_package_sizes: [
      { size: 300, unit: 'g', price_cents: 299 },
    ],
    shelf_life_days: 7,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Seitan',
    category: 'Kühlregal',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 14,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },

  // ─── Additional Tiefkühl ─────────────────────────────────────────────────

  {
    name_de: 'TK-Blätterteig',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 450, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },
  {
    name_de: 'TK-Maisbrot',
    category: 'Tiefkühl',
    default_unit: 'g',
    common_package_sizes: [
      { size: 450, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 365,
    storage_type: 'Tiefkühler',
    is_seasonal: false,
  },

  // ─── Additional Obst & Gemüse ─────────────────────────────────────────────

  {
    name_de: 'Feldsalat Schale',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 125, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 3,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [10, 11, 12, 1, 2, 3],
  },
  {
    name_de: 'Zuckerschoten',
    category: 'Obst & Gemüse',
    default_unit: 'g',
    common_package_sizes: [
      { size: 200, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 4,
    storage_type: 'Kühlschrank',
    is_seasonal: true,
    season_months: [4, 5, 6, 7],
  },
  {
    name_de: 'Pak Choi',
    category: 'Obst & Gemüse',
    default_unit: 'Stück',
    common_package_sizes: [
      { size: 1, unit: 'Stück', price_cents: 149 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },
  {
    name_de: 'Minze frisch',
    category: 'Obst & Gemüse',
    default_unit: 'Bund',
    common_package_sizes: [
      { size: 1, unit: 'Bund', price_cents: 69 },
    ],
    shelf_life_days: 5,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },

  // ─── Additional Milchprodukte ─────────────────────────────────────────────

  {
    name_de: 'Halbfettmilch H-Milch',
    category: 'Milchprodukte',
    default_unit: 'l',
    common_package_sizes: [
      { size: 1, unit: 'l', price_cents: 109 },
    ],
    shelf_life_days: 90,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Haferdrink',
    category: 'Milchprodukte',
    default_unit: 'ml',
    common_package_sizes: [
      { size: 1000, unit: 'ml', price_cents: 169 },
    ],
    shelf_life_days: 60,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },

  // ─── Additional Fleisch & Wurst ───────────────────────────────────────────

  {
    name_de: 'Hähnchenwings',
    category: 'Fleisch & Wurst',
    default_unit: 'g',
    common_package_sizes: [
      { size: 1000, unit: 'g', price_cents: 499 },
    ],
    shelf_life_days: 2,
    storage_type: 'Kühlschrank',
    is_seasonal: false,
  },

  // ─── Additional Konserven & Gläser ───────────────────────────────────────

  {
    name_de: 'Artischockenherzen',
    category: 'Konserven & Gläser',
    default_unit: 'g',
    common_package_sizes: [
      { size: 285, unit: 'g', price_cents: 249 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Paprika aus dem Glas geröstet',
    category: 'Konserven & Gläser',
    default_unit: 'g',
    common_package_sizes: [
      { size: 290, unit: 'g', price_cents: 199 },
    ],
    shelf_life_days: 365,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },

  // ─── Additional Trockenwaren ──────────────────────────────────────────────

  {
    name_de: 'Gelbe Linsen',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 139 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
  {
    name_de: 'Sojabohnen trocken',
    category: 'Trockenwaren & Beilagen',
    default_unit: 'g',
    common_package_sizes: [
      { size: 500, unit: 'g', price_cents: 179 },
    ],
    shelf_life_days: 730,
    storage_type: 'Vorratskammer',
    is_seasonal: false,
  },
];
