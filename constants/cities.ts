export const SUPPORTED_CITIES = [
  'Paris',
  'Lyon',
  'Marseille',
  'Toulouse',
  'Nice',
  'Nantes',
  'Montpellier',
  'Strasbourg',
  'Bordeaux',
  'Lille',
  'Rennes',
  'Reims',
  'Le Havre',
  'Saint-Etienne',
  'Toulon',
  'Grenoble',
  'Dijon',
  'Angers',
  'Nimes',
  'Clermont-Ferrand',
] as const;

export type SupportedCity = (typeof SUPPORTED_CITIES)[number];
