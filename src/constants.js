// Die sieben Produktfamilien. Genug fuer Muster, wenig genug, dass keine
// Gruppe auf zwei Produkte schrumpft.
export const FAMILIES = [
  'erp-suite',
  'hcm',
  'spend-travel',
  'cx',
  'data-analytics',
  'platform-dev',
  'industry-clouds'
];

export const FAMILY_LABELS = {
  'erp-suite': 'ERP & Suite',
  'hcm': 'HCM',
  'spend-travel': 'Spend & Travel',
  'cx': 'CX',
  'data-analytics': 'Data & Analytics',
  'platform-dev': 'Platform & Dev',
  'industry-clouds': 'Industry Clouds'
};

// Wie belastbar ist das Datum? 'by' heisst: frueheste belegbare Erwaehnung,
// der tatsaechliche Beginn kann davor liegen.
export const QUALIFIERS = ['launch', 'announcement', 'effective', 'by'];

// Art des Uebergangs *in* diese Periode hinein. Die erste Periode eines
// Produkts hat keinen Uebergang, sie ist der Ausgangszustand.
export const TRANSITIONS = ['rename', 'assimilation', 'generation'];

// Nur 'rename' geht in Median, Familienfrequenz und Index ein. Eine
// Eingliederung nach Zukauf ist vorhersehbar, ein Generationswechsel ist
// kein Rebranding.
export const COUNTED_TRANSITIONS = ['rename'];

export const ORIGINS = ['organic', 'acquired'];

// Quellenrang nach Abschnitt 7 des Briefings. 'analyst' und 'blog' sind
// nachrangig und werden in der Oberflaeche als solche gekennzeichnet.
export const SOURCE_TYPES = ['first-party', 'archive', 'analyst', 'blog'];
export const WEAK_SOURCE_TYPES = ['analyst', 'blog'];

// Eine Familie mit weniger als so vielen abgeschlossenen Umbenennungen gilt
// als duenne Datenlage und wird gekennzeichnet, nicht zusammengelegt.
export const SPARSE_FAMILY_THRESHOLD = 2;
