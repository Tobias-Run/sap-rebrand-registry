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
| `emoji` | String | nein | ein oder zwei Emoji als Zeilenmarke. Fehlt es, gibt es eine Warnung |
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

## Emoji statt Logo

Die Seite zeigt keine SAP-Logos und keine Marken als Grafik — das bleibt so. Ein Emoji je Produkt ist etwas anderes: eine Zeilenmarke, die eine lange Namenskette optisch trägt und ein Produkt in einer langen Tabelle wiederfindbar macht. Es steht für das, was das Produkt tut, nie für die Marke.

Gezählt werden sichtbare Zeichen, nicht Codepunkte: `🗄️` und `🧑‍🏭` sind je ein Zeichen, auch wenn Variationsselektor und ZWJ-Folge mehrere Codepunkte belegen. Zwei Zeichen sind die Grenze.

## Datumsangaben

Erlaubt sind `YYYY`, `YYYY-MM` und `YYYY-MM-DD`. Die Präzision der Quelle bleibt erhalten: Wo nur ein Jahr belegt ist, steht ein Jahr. **Es wird nie ein Tag erfunden**, um die Tabelle gleichmäßig aussehen zu lassen.

Für Vergleiche und Rechnungen wird auf den ersten Tag der jeweiligen Präzision normalisiert — `2015` und `2015-01-01` bezeichnen denselben Zeitpunkt. Für die Anzeige gilt das nicht: Dort bleibt sichtbar, wie genau eine Angabe wirklich ist.

Der Validator prüft auch den Kalender: `2015-02-29` wird abgewiesen, `2016-02-29` nicht.

## Wie datiert wird

Der Validator prüft die Form, nicht die Wahrheit. Für die Wahrheit gilt eine Regel, die beim Erheben durchgehalten werden muss:

**Verankert wird an dem, was der belegende Satz selbst behauptet.** Nennt die Quelle ein Datum („Released in 2019", „we have begun to sunset the SAP Cloud Platform brand in January 2021"), gilt dieses Datum in seiner Präzision, mit `launch`, `announcement` oder `effective`. Nennt sie keines und belegt nur, dass ein Name zu ihrem Erscheinungszeitpunkt in Gebrauch war, gilt das Erscheinungsdatum der Quelle mit `qualifier: "by"`.

Daraus folgt eine bekannte Verzerrung: `by`-Daten liegen systematisch **später** als der wahre Beginn. Eine Umbenennung im April erscheint als „by" des Jahres, in dem sie erstmals belegt ist. Für Medianwerte heißt das, dass Namensperioden eher zu kurz als zu lang gemessen werden. Das ist der Preis dafür, kein Datum zu erfinden — und der Grund, warum `by` überhaupt existiert.

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
14. `emoji` enthaelt, falls gesetzt, keine Buchstaben oder Ziffern und hoechstens zwei sichtbare Zeichen.

Warnungen, die nicht blockieren: eine Periode ohne Erstquelle, eine Quelle, die niemand referenziert, ein Produkt ohne Emoji.

## Warum `transition` der Kern ist

- **`rename`** — reine Umbenennung bei fortbestehendem Produkt. Der Normalfall und die **einzige** Kategorie, die in Median, Familienfrequenz und Index eingeht.
- **`assimilation`** — Eingliederung nach einem Zukauf, typischerweise das Voranstellen des SAP-Kürzels. Faktisch vorhersehbar. Zählte man sie mit, wirkten zugekaufte Familien künstlich unruhig, und der Index sagte Umbenennungen für Produkte voraus, die ihre Pflichtrunde längst hinter sich haben. Stattdessen eigene Kennzahl: „Zeit bis zur SAP-Werdung", die Spanne zwischen `acquisitionDate` und der ersten `assimilation`-Periode.
- **`generation`** — Technologie- oder Generationswechsel, kein Rebranding. Standardmäßig ausgeblendet, per Filter zuschaltbar, nie in den Statistiken.

Beim Vorbild sind Plattformtransformationen schlicht ausgeschlossen. Bei SAP sind sie zu häufig, um sie zu ignorieren, und zu andersartig, um sie mitzuzählen.

## Offene Entscheidungen

Drei Punkte sind bewusst nicht entschieden und dürfen es auch nicht einseitig werden:

**Rückbenennungen.** Zählt die Rückkehr zu einem früheren Namen als neue Periode oder als Korrektur der vorherigen? SAP hat das mehrfach getan, besonders im Analytics-Bereich. Die Wahl verschiebt die Medianwerte spürbar. Beide Varianten werden am fertigen Datensatz durchgerechnet und zur Entscheidung vorgelegt (Schritt 6).

**Umbenennungswellen.** Das Schema hat kein Feld dafür, dass mehrere Produkte gemeinsam umbenannt wurden — etwa im Januar 2021, als die Marke „SAP Cloud Platform" abgeschafft wurde. Ein optionales `wave`-Feld auf Periodenebene würde auf der Analyseseite einen Abschnitt tragen, den das Vorbild nicht haben kann: SAP benennt nicht einzeln um, sondern in Schüben. Kostet ein Feld und eine Validierungsregel.

Der erste Datensatz belegt das Muster bereits: `sap-btp` und `sap-integration-suite` haben beide eine Periode mit `start: "2021-01"`, aus derselben Quelle. Bei zehn Produkten sind das zwei — die Welle ist im Datensatz sichtbar, aber noch nicht groß genug, um die Feldfrage zu entscheiden.

**Parallel weiterlaufende Vorgänger.** Der Datensatz stößt an eine Grenze des Modells: Eine Namenskette unterstellt, dass der alte Name endet, wenn der neue beginnt. Bei SAP stimmt das oft nicht. SAP ERP wird bis heute gepflegt, obwohl SAP S/4HANA seit 2015 danebensteht; dasselbe gilt für SAP BW neben SAP BW/4HANA. Beide sind deshalb **nicht** als `generation`-Periode ihres Vorgängers erfasst — das würde behaupten, der Vorgänger sei beendet.

Damit fehlt dem Register aber genau der Übergang, für den `generation` gedacht war. Zur Wahl stehen: den Nachfolger als eigenes Produkt führen (ehrlich, aber die Verbindung geht verloren), das Modell um überlappende Perioden erweitern (teuer, betrifft jede Validierungsregel), oder `generation` auf die Fälle beschränken, in denen der Vorgänger wirklich verschwindet (so ist es jetzt, siehe `sap-erp`: SAP R/3 → mySAP ERP). Gehört mit Schritt 6 entschieden.
