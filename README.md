# Umrechner-Werkzeugkasten

Umrechner für Entwickler und Admins in einer Oberfläche. Läuft komplett im Browser, ohne Server und ohne Tracking.

## Rechner

- **Farbe:** Hex oder RGB, dazu Binär, Dezimal, CSS-RGB und HSL mit Vorschau
- **Zahlensysteme:** Dezimal, Binär, Hexadezimal, Oktal
- **IPv4 / CIDR:** Netzmaske, Netzadresse, Broadcast, Hostanzahl
- **Subnetze:** Netz in kleinere Subnetze aufteilen
- **MAC:** Formate umwandeln, OUI-Präfix, Unicast/Multicast
- **Zeitstempel:** Unix-Zeit, ISO-Datum, UTC und lokale Zeit

## Funktionen

- Verlauf, der lokal im Browser gespeichert wird
- Ergebnisse kopieren und an einen anderen Rechner weiterreichen
- Teilen per Link: Rechner und Eingabe stehen in der URL

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
