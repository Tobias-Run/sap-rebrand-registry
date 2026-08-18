# SAP Rebrand Registry

Ein unabhängiges Rechercheprojekt: wie oft und wann SAP seine Produkte umbenannt hat.

Zwei Seiten, statisch, ohne Server-Logik. Ein **Register** mit allen belegten Namensperioden je Produkt und eine **Analyse**, die daraus Median-Laufzeiten, Familienmuster und einen halbernsten Risk Index berechnet. Alle Zahlen entstehen im Browser aus einer einzigen Datei — nichts wird von Hand fortgeschrieben.

**Status:** in Aufbau. Der Datensatz hat einen belegten Kern — 10 Produkte, 25 Namensperioden, jede mit Erstquelle, keine Warnungen. Die beiden Seiten fehlen noch.

## Warum

Für Microsoft existiert mit der [Microsoft Rebrand Registry](https://www.msrebrandregistry.com) ein Vorbild. Für SAP gibt es nichts Vergleichbares — nachgesehen und dokumentiert in [VERGLEICHBARE-PROJEKTE.md](VERGLEICHBARE-PROJEKTE.md). Am nächsten kommt Wikipedias „List of SAP products", die Umbenennungen im Fließtext erwähnt, ohne Datum und ohne Einzelbeleg.

Dieses Projekt ist eine Neuimplementierung, kein Fork. Warum es das sein muss, steht in [LIZENZPRUEFUNG.md](LIZENZPRUEFUNG.md): Das Vorbild trägt keine Lizenz, damit gilt „all rights reserved". Übernommen sind ausschließlich das Konzept und die Kennzahldefinition — beides nicht schutzfähig —, kein Code, kein CSS, kein Text, keine Daten.

## Belegpflicht

Jede Namensperiode zitiert mindestens eine Quelle. Die Präzision der Quelle bleibt erhalten: Wo nur ein Jahr belegt ist, steht ein Jahr, kein erfundener Tag. Ein Qualifier hält fest, ob ein Datum Ankündigung, Marktstart, Wirksamkeit oder nur der früheste belegbare Zeitpunkt ist.

Bevorzugte Quellen in dieser Reihenfolge: SAP News Center, SAP Help Portal einschließlich archivierter Stände, offizielle Produktseiten über die Wayback Machine, TechEd- und Sapphire-Keynotes. Analystenberichte und Blogs nur, wenn nichts Besseres existiert, und dann als solche gekennzeichnet.

## Drei Arten von Übergang

Der Kern des Projekts ist eine Unterscheidung, die das Vorbild nicht braucht:

- **`rename`** — reine Umbenennung bei fortbestehendem Produkt. Der Normalfall und die einzige Kategorie, die in Median und Index eingeht.
- **`assimilation`** — Eingliederung nach einem Zukauf, typischerweise das Voranstellen des SAP-Kürzels. Faktisch vorhersehbar, deshalb außerhalb der Statistik. Stattdessen eigene Kennzahl: „Zeit bis zur SAP-Werdung".
- **`generation`** — Technologie- oder Generationswechsel, kein Rebranding. Standardmäßig ausgeblendet, per Filter zuschaltbar, nie in den Statistiken.

Zählte man alle drei zusammen, wirkten zugekaufte Familien künstlich unruhig, und der Index sagte Umbenennungen für Produkte voraus, die ihre Pflichtrunde längst hinter sich haben.

## Was der Index nicht ist

Der Risk Index misst historischen Umbenennungsdruck. Er ist keine Wahrscheinlichkeit und keine Aussage über SAPs Pläne. Diese Einschränkung gehört auf die Analyseseite selbst, nicht ins Kleingedruckte.

## Nicht im Umfang

Eingestellte Produkte, Logo-Historie, Umbenennungen von Preismodellen, SAP-interne Projektnamen. Kein Bildmaterial: keine SAP-Logos, keine Markenzeichen als Grafik. Die Seite ist rein textuell.

## Angedacht, nicht entschieden

**Anonyme War Stories.** Zu einer Umbenennung die Erfahrungen derer sammeln, die sie ausbaden mussten — der eigentliche Grund, warum ein solches Register jemanden interessiert. Der Haken ist nicht die Idee, sondern was sie kostet: Das Projekt ist heute zwei statische Seiten über einer einzigen Datei, ohne Server, ohne Zustand. Nutzerbeiträge brauchen Annahme, Speicherung, Moderation und einen Umgang mit Missbrauch und Personenbezug. Das ist eine eigene Entscheidung mit eigenem Aufwand, kein Zusatzfeature — und sie wäre erst sinnvoll, wenn das Register selbst steht.

## Lizenz

Code unter der [MIT-Lizenz](LICENSE). Datensatz unter [CC BY 4.0](LICENSE-DATA). Getrennt, damit die Recherchearbeit weiterverwendbar bleibt, auch wenn jemand den Code nicht braucht.

## Rechtliches

Unabhängiges Rechercheprojekt ohne Verbindung zu SAP. Produktnamen und Marken gehören SAP SE. Kein Anspruch auf Vollständigkeit.
