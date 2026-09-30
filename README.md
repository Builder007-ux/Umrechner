# Umrechner-Werkzeugkasten

Umrechner für Entwickler und Admins in einer Oberfläche. Läuft komplett im Browser, ohne Server und ohne Tracking.

## Rechner

Drei Oberkategorien, jeweils mit eigener Tab-Reihe:

**IT & Netze**
- **Farbe:** Hex oder RGB, dazu Binär, Dezimal, CSS-RGB und HSL mit Vorschau
- **Zahlensysteme:** Dezimal, Binär, Hexadezimal, Oktal
- **IPv4 / CIDR:** Netzmaske, Netzadresse, Broadcast, Hostanzahl
- **Subnetze:** Netz in kleinere Subnetze aufteilen, mit "Alle kopieren"
- **MAC:** Formate umwandeln, OUI-Präfix, Unicast/Multicast
- **Zeitstempel:** Unix-Zeit, ISO-Datum, UTC und lokale Zeit
- **Zeitzonen:** eine Uhrzeit in mehreren Zeitzonen anzeigen
- **Base64:** Text kodieren, gültiges Base64 zusätzlich dekodieren
- **JSON:** validieren, formatieren und kompakt darstellen

**Maße**
- **Länge, Gewicht, Volumen:** gängige Einheiten umrechnen (z. B. "5 km", "2 kg", "1,5 l")
- **Temperatur:** Celsius, Fahrenheit, Kelvin

**Währungen**
- Betrag und Währungscode (z. B. "100 USD") gegen die gängigsten Währungen umrechnen. Die Kurse kommen von der kostenlosen API [frankfurter.app](https://frankfurter.app) (Referenzkurse der Europäischen Zentralbank). Das sind tagesaktuelle Kurse, werktags aktualisiert, keine Echtzeit-Handelskurse. Ohne Internetverbindung erscheint eine Fehlermeldung, Kurse werden pro Tag einmal abgerufen und danach lokal zwischengespeichert.

## Funktionen

- Verlauf, der lokal im Browser gespeichert wird
- Ergebnisse kopieren und an einen anderen Rechner weiterreichen
- Teilen per Link: Kategorie, Rechner und Eingabe stehen in der URL
- Tastenkürzel 1 bis 9 zum Wechseln zwischen den Rechnern der aktiven Kategorie
- Merkt sich die zuletzt benutzte Kategorie und den zuletzt benutzten Rechner je Kategorie

## Lokal nutzen

`index.html` im Browser öffnen. Es wird nichts installiert.

Tests (Node.js 18 oder neuer, keine Pakete nötig):

```
npm test
```

## Neuen Rechner hinzufügen

1. In `src/core.js` einen Eintrag in `tools` ergänzen (Name, Platzhalter, Hinweis, `run`-Funktion).
2. In `test/core.test.js` einen Test dazu schreiben.

Tab, Verlauf und Link-Teilen funktionieren automatisch.

## Struktur

```
index.html          Oberfläche
src/core.js         Rechenlogik ohne Browser-Abhängigkeit
test/core.test.js   Tests
```

## Lizenz

MIT, siehe `LICENSE`.
