/**
 * Курируемый набор lucide-иконок для favicon. Сгруппирован по темам,
 * имена соответствуют экспортам из lucide-react (PascalCase). На canvas
 * рендерим через renderToStaticMarkup → SVG-Blob → Image (см. renderer.ts).
 *
 * Категории хранятся как i18n-ключи — UI переводит через useT().
 */
export const ICON_LIBRARY: { category: string; names: string[] }[] = [
  {
    category: "icon.cat.popular",
    names: [
      "Heart",
      "Star",
      "Sparkles",
      "Flame",
      "Zap",
      "Bolt",
      "Sun",
      "Moon",
      "Cloud",
      "Crown",
      "Gem",
      "Gift",
    ],
  },
  {
    category: "icon.cat.tech",
    names: [
      "Code",
      "Code2",
      "Terminal",
      "Cpu",
      "Database",
      "Server",
      "HardDrive",
      "Cog",
      "Settings",
      "Wrench",
      "Bug",
      "Bot",
    ],
  },
  {
    category: "icon.cat.communication",
    names: ["Mail", "MessageSquare", "MessageCircle", "Send", "Phone", "Bell", "BellRing"],
  },
  {
    category: "icon.cat.objects",
    names: [
      "Briefcase",
      "BookOpen",
      "Book",
      "Camera",
      "Coffee",
      "Pizza",
      "Cake",
      "Trophy",
      "Award",
      "Flag",
      "Bookmark",
      "Tag",
    ],
  },
  {
    category: "icon.cat.nature",
    names: [
      "Leaf",
      "Trees",
      "TreePine",
      "Droplet",
      "Droplets",
      "Snowflake",
      "Wind",
      "Rainbow",
      "Sprout",
    ],
  },
  {
    category: "icon.cat.symbols",
    names: [
      "Shield",
      "ShieldCheck",
      "Lock",
      "Unlock",
      "Key",
      "Anchor",
      "Compass",
      "Globe",
      "Target",
      "Crosshair",
      "Atom",
      "Brain",
    ],
  },
  {
    category: "icon.cat.transport",
    names: ["Rocket", "Plane", "Car", "Bike", "Ship", "Train"],
  },
  {
    category: "icon.cat.music",
    names: ["Music", "Music2", "Headphones", "Mic", "Palette", "Paintbrush", "Image", "Film"],
  },
  {
    category: "icon.cat.time",
    names: ["Clock", "Timer", "Calendar", "CalendarDays", "AlarmClock", "Hourglass"],
  },
  {
    category: "icon.cat.geometry",
    names: ["Circle", "Square", "Triangle", "Hexagon", "Pentagon", "Octagon", "Diamond"],
  },
];

/** Все имена иконок в одной плоской последовательности. */
export const ALL_ICON_NAMES = ICON_LIBRARY.flatMap((g) => g.names);
