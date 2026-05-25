/**
 * Курируемый набор lucide-иконок для favicon. Сгруппирован по темам,
 * имена соответствуют экспортам из lucide-react (PascalCase). На canvas
 * рендерим через renderToStaticMarkup → SVG-Blob → Image (см. renderer.ts).
 */
export const ICON_LIBRARY: { category: string; names: string[] }[] = [
  {
    category: "Популярные",
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
    category: "Технологии",
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
    category: "Связь",
    names: ["Mail", "MessageSquare", "MessageCircle", "Send", "Phone", "Bell", "BellRing"],
  },
  {
    category: "Объекты",
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
    category: "Природа",
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
    category: "Символы",
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
    category: "Транспорт",
    names: ["Rocket", "Plane", "Car", "Bike", "Ship", "Train"],
  },
  {
    category: "Музыка / Творчество",
    names: ["Music", "Music2", "Headphones", "Mic", "Palette", "Paintbrush", "Image", "Film"],
  },
  {
    category: "Время",
    names: ["Clock", "Timer", "Calendar", "CalendarDays", "AlarmClock", "Hourglass"],
  },
  {
    category: "Геометрия",
    names: ["Circle", "Square", "Triangle", "Hexagon", "Pentagon", "Octagon", "Diamond"],
  },
];

/** Все имена иконок в одной плоской последовательности. */
export const ALL_ICON_NAMES = ICON_LIBRARY.flatMap((g) => g.names);
