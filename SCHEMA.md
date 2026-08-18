# Datenschema

Kanonisch ist `src/data/products.json`. Alles Weitere — Laufzeiten, Median, Familienmuster, Index — wird daraus im Browser berechnet. Es gibt keine zweite Datenhaltung und keine von Hand gepflegten Kennzahlen.

Geprüft wird mit `npm run validate`. Das Skript läuft in CI und bricht bei jedem Fehler ab. Warnungen erscheinen, blockieren aber nicht.

## Aufbau

```json
{
  "asOf": "2026-08-18",
  "sources": [ … ],
  "products": [ … ]
}
```

`asOf` ist tagesgenau und Pflicht. Laufende Namensperioden werden gegen dieses Datum gerechnet, nicht gegen die Uhr des Besuchers — sonst wäre keine Zahl auf der Seite reproduzierbar.

## Produkt

| Feld | Typ | Pflicht | Anmerkung |
| --- | --- | --- | --- |
| `id` | Slug | ja | Kleinbuchstaben, Ziffern, Bindestriche. Ändert sich nie, auch nach einer Umbenennung nicht |
| `currentName` | String | ja | muss dem Namen der laufenden Periode entsprechen |
| `family` | Enum | ja | eine der sieben Familien, siehe `src/constants.js` |
| `origin` | `organic` \| `acquired` | ja | |
| `acquiredFrom` | String | nur bei `acquired` | bei `organic` ein Fehler, nicht bloß überflüssig |
| `acquisitionDate` | Datum | nur bei `acquired` | darf nicht nach der ersten `assimilation`-Periode liegen |
| `periods` | Array | ja | chronologisch, mindestens ein Eintrag |

## Periode

| Feld | Typ | Pflicht | Anmerkung |
| --- | --- | --- | --- |
| `name` | String | ja | |
| `start` | Datum | ja | inklusiv |
| `end` | Datum | alle außer einer | exklusiv. Genau eine Periode je Produkt hat kein `end` |
| `qualifier` | `launch` \| `announcement` \| `effective` \| `by` | ja | `by` = frühestes belegbares Datum, der wahre Beginn kann davor liegen |
| `transition` | `rename` \| `assimilation` \| `generation` | alle außer der ersten | Art des Übergangs **in diese** Periode hinein |
| `sources` | Array von Quellen-IDs | ja | mindestens eine, jede muss auflösbar sein |

## Quelle

| Feld | Pflicht | Anmerkung |
| --- | --- | --- |
| `id` | ja | eindeutig |
| `title`, `publisher` | ja | |
| `url` | ja | muss mit `http://` oder `https://` beginnen |
| `type` | ja | `first-party`, `archive`, `analyst`, `blog` |
| `published`, `retrieved` | nein | Datum, falls bekannt |

`analyst` und `blog` gelten als nachrangig. Stützt sich eine Periode ausschließlich darauf, erscheint eine Warnung — die Seite kennzeichnet solche Belege später auch sichtbar.

## Datumsangaben

Erlaubt sind `YYYY`, `YYYY-MM` und `YYYY-MM-DD`. Die Präzision der Quelle bleibt erhalten: Wo nur ein Jahr belegt ist, steht ein Jahr. **Es wird nie ein Tag erfunden**, um die Tabelle gleichmäßig aussehen zu lassen.

Für Vergleiche und Rechnungen wird auf den ersten Tag der jeweiligen Präzision normalisiert — `2015` und `2015-01-01` bezeichnen denselben Zeitpunkt. Für die Anzeige gilt das nicht: Dort bleibt sichtbar, wie genau eine Angabe wirklich ist.

Der Validator prüft auch den Kalender: `2015-02-29` wird abgewiesen, `2016-02-29` nicht.

## Regeln, die der Validator durchsetzt

1. `asOf` ist vorhanden und tagesgenau.
2. Jedes Produkt hat **genau eine** laufende Periode, und das ist die **letzte**.
3. Die Perioden sind lückenlos und überschneidungsfrei: Das `end` einer Periode ist zeichengleich das `start` der nächsten.
4. Kein Datum liegt nach `asOf`.
5. Ein `end` liegt nach seinem `start`.
6. Die **erste** Periode hat **kein** `transition` — sie ist der Ausgangszustand, es gibt keinen Übergang in sie hinein. Jede weitere Periode hat eines.
7. `assimilation` setzt `origin: "acquired"` voraus.
8. `acquisitionDate` liegt nicht nach der ersten `assimilation`-Periode.
9. `acquiredFrom` und `acquisitionDate` gibt es nur bei `origin: "acquired"`, dort aber verpflichtend.
10. Jede Periode zitiert mindestens eine auflösbare Quelle.
11. Produkt- und Quellen-IDs sind eindeutig, Produkt-IDs sind Slugs.
12. `currentName` entspricht dem Namen der laufenden Periode.
13. Alle Enum-Felder halten sich an ihre Werteliste.

Warnungen, die nicht blockieren: eine Periode ohne Erstquelle, eine Quelle, die niemand referenziert.

## Warum `transition` der Kern ist

- **`rename`** — reine Umbenennung bei fortbestehendem Produkt. Der Normalfall und die **einzige** Kategorie, die in Median, Familienfrequenz und Index eingeht.
- **`assimilation`** — Eingliederung nach einem Zukauf, typischerweise das Voranstellen des SAP-Kürzels. Faktisch vorhersehbar. Zählte man sie mit, wirkten zugekaufte Familien künstlich unruhig, und der Index sagte Umbenennungen für Produkte voraus, die ihre Pflichtrunde längst hinter sich haben. Stattdessen eigene Kennzahl: „Zeit bis zur SAP-Werdung", die Spanne zwischen `acquisitionDate` und der ersten `assimilation`-Periode.
- **`generation`** — Technologie- oder Generationswechsel, kein Rebranding. Standardmäßig ausgeblendet, per Filter zuschaltbar, nie in den Statistiken.

Beim Vorbild sind Plattformtransformationen schlicht ausgeschlossen. Bei SAP sind sie zu häufig, um sie zu ignorieren, und zu andersartig, um sie mitzuzählen.

## Offene Entscheidungen

Zwei Punkte sind bewusst nicht entschieden und dürfen es auch nicht einseitig werden:

**Rückbenennungen.** Zählt die Rückkehr zu einem früheren Namen als neue Periode oder als Korrektur der vorherigen? SAP hat das mehrfach getan, besonders im Analytics-Bereich. Die Wahl verschiebt die Medianwerte spürbar. Beide Varianten werden am fertigen Datensatz durchgerechnet und zur Entscheidung vorgelegt (Schritt 6).

**Umbenennungswellen.** Das Schema hat kein Feld dafür, dass mehrere Produkte am selben Tag gemeinsam umbenannt wurden — etwa am 18.01.2021, als die Marke „SAP Cloud Platform" abgeschafft wurde. Ein optionales `wave`-Feld auf Periodenebene würde auf der Analyseseite einen Abschnitt tragen, den das Vorbild nicht haben kann: SAP benennt nicht einzeln um, sondern in Schüben. Kostet ein Feld und eine Validierungsregel. Solange kein Datensatz existiert, ist ein Nachrüsten folgenlos.
