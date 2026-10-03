# Umrechner-Werkzeugkasten

Ein kostenloser, werbefreier Werkzeugkasten für IT, Netzwerk, Developer- und Admin-Aufgaben, dazu Maßeinheiten und Währungen. Läuft komplett im Browser, ohne Server, ohne Tracking, ohne Build-Schritt.

## Kategorien & Tools

**🌐 Netzwerk** — IPv4 / CIDR, Subnetze aufteilen, Wildcard-Maske ↔ Netzmaske, MAC-Adressen, IPv6 (komprimieren/erweitern)

**💻 Developer** — Farbe (Hex/RGB/HSL), Zahlensysteme, Hex ↔ Text, ASCII/Unicode, URL-Encoding, Base64, JSON (formatieren/minifizieren), Zeichen zählen, UUID-Generator

**🔐 Security** — Hash-Generator (SHA-1/256/384/512), Zufallstoken

**🖥️ System** — Zeitstempel (Unix), Zeitzonen, chmod (oktal ↔ symbolisch)

**📏 Maße** — Länge, Fläche, Volumen, Gewicht, Geschwindigkeit, Dauer, Druck, Energie, Leistung, Frequenz, Winkel, Daten (SI 1000 vs. IEC 1024), Temperatur

**💱 Währungen** — Beträge umrechnen, Tageskurse der Europäischen Zentralbank über [frankfurter.app](https://frankfurter.app) (kostenlos, kein Schlüssel nötig). Das sind werktags aktualisierte Referenzkurse, keine Echtzeit-Handelskurse.

## Funktionen

- Suche über alle Tools (Name + alternative Suchbegriffe wie "CIDR", "chmod", "kg")
- Zuletzt verwendete Rechner werden gemerkt und oben angezeigt
- Verlauf pro Browser, lokal gespeichert
- Ergebnisse kopieren, bei manchen Tools an ein anderes Tool weiterreichen
- Teilen per Link: Kategorie, Tool und Eingabe stehen in der URL
- Tastenkürzel 1–9 wechseln zwischen den Tools der aktiven Kategorie
- Manueller Hell/Dunkel-Umschalter (Kreis-Symbol oben rechts), merkt sich die Wahl

## Architektur

Bewusst **ohne** Build-Tool und **ohne** ES-Modules, damit die Seite sich weiterhin per Doppelklick lokal öffnen und testen lässt (ES-Modules blockieren Browser bei `file://` aus Sicherheitsgründen). Stattdessen klassische `<script>`-Dateien, die sich in ein gemeinsames Register eintragen:

```
index.html                 Oberfläche (Suche, Kategorien, Light/Dark)
src/shared.js               gemeinsame Hilfsfunktionen (Formatierung, linearer Umrechner-Baukasten)
src/app.js                   UI-Logik: Kategorien, Suche, Verlauf, Rendering
src/tools/network.js         IPv4, Subnetze, Wildcard, MAC, IPv6
src/tools/developer.js       Farbe, Zahlensysteme, Hex, ASCII, URL, Base64, JSON, Zeichenzähler, UUID
src/tools/security.js        Hash-Generator, Zufallstoken
src/tools/system.js          Zeitstempel, Zeitzonen, chmod
src/tools/mass.js            alle 13 Maßeinheiten-Rechner
src/tools/currency.js        Währungsumrechnung (ruft frankfurter.app ab)
test/*.test.js               ein Test-File pro Tool-Datei
robots.txt, sitemap.xml      SEO-Grundlagen
```

Jede Tool-Datei funktioniert sowohl im Browser (hängt sich an `window.ToolsRegistry`) als auch in Node für die Tests (`module.exports`).

### Neuen Rechner hinzufügen

1. Passende Datei in `src/tools/` öffnen (oder neue Kategorie-Datei anlegen).
2. Eintrag ergänzen: `name`, `ph` (Platzhalter), `hint`, `category`, `keywords` (für die Suche), `run(text)`.
3. `run()` gibt `{ rows: [...] }` oder `{ error: "..." }` zurück, bei Bedarf auch `async run()` (z. B. für Netzwerk-Abfragen).
4. Test in der passenden `test/*.test.js` ergänzen.
5. Für eine ganz neue Kategorie: Eintrag in `categories` in `src/app.js` ergänzen (Icon, Name) und die neue Datei in `index.html` per `<script src="...">` einbinden.

Suche, Tabs, Verlauf, Kopieren und Teilen funktionieren für jeden neuen Rechner automatisch mit.

### Testen

```
npm test
```
Node.js 18 oder neuer, keine Pakete nötig.

## Bekannte Einschränkungen (Stand jetzt)

- **UUID-Generator, Hash-Generator, Zufallstoken** nutzen `crypto.randomUUID` / `crypto.subtle` / `crypto.getRandomValues`. Diese benötigen einen sicheren Kontext (HTTPS oder `localhost`). Auf GitHub Pages funktioniert das, beim lokalen Öffnen per Doppelklick (`file://`) zeigen UUID- und Hash-Generator eine Fehlermeldung.
- **chmod** unterstützt bisher nur den dreistelligen Modus (z. B. 755), noch keine Spezial-Bits (setuid/setgid/sticky, vierstellig wie 4755).
- **Dauer-Umrechner**: Monate/Jahre sind Durchschnittswerte (Jahr = 365,25 Tage), keine Kalenderrechnung.
- **Keine eigenen URLs pro Tool** (nur `#t=...&q=...`-Anker). Für echtes SEO pro Tool (eigene, von Google indexierbare Adressen) braucht es entweder mehrere HTML-Dateien oder eine Prerendering-Lösung — das ist eine größere Architekturentscheidung für eine der nächsten Ausbaustufen.
- **Kategorien** sind bewusst breiter geschnitten als im Langfrist-Plan (z. B. kein separates „Cloud“). Wird aufgeteilt, sobald genug Tools je Bereich da sind.

## Roadmap (nächste Ausbaustufen, noch nicht umgesetzt)

- Weitere Developer-Tools: HTML-Entity-Encoding, JWT-Decoder (nur dekodieren, keine Signaturprüfung), Regex-Tester, JSON ↔ YAML, Zeilenenden-Konverter
- Weitere Netzwerk-Tools: IPv4-Host/Netz/Broadcast als eigenständiges Detail-Tool, IP ↔ Binär/Integer als Direktrechner
- Weitere System-Tools: Bandbreite ↔ Downloadzeit, Speicherplatz-Rechner, chmod mit Spezial-Bits
- Eigene URLs pro Tool für besseres SEO (erfordert Architekturentscheidung, wird vorher besprochen)
- Feinere Kategorien (Netzwerk/Developer/Security/System/Cloud), sobald mehr Tools je Bereich bestehen

## Lizenz

MIT, siehe `LICENSE`.
