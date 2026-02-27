# Dashboard Suite - Installation, Lizenz & Update-System Plan

## Übersicht

Dieses Dokument beschreibt das Konzept für:
1. **Installations-Assistent** - Benutzerfreundlicher Installer mit Lizenz-Eingabe
2. **Lizenzsystem** - Aktivierung mit Authentifizierungscodes
3. **Update-Server** - Automatische Updates für die Desktop-App
4. **Verteilung** - Wie Benutzer die App erhalten und Updates bekommen

---

## 1. Installations-Assistent

### Ziel
- Professioneller Windows-Installer (.exe)
- Deutsch/English Sprachauswahl
- Lizenzcode-Eingabe während der Installation
- Automatischer Start nach Installation

### Umsetzung (NSIS via Tauri)
```json
// tauri.conf.json - NSIS Konfiguration
{
  "bundle": {
    "windows": {
      "nsis": {
        "installMode": "perUser",
        "displayLanguageSelector": true,
        "languages": ["German", "English"],
        "installerIcon": "icons/icon.ico",
        "headerImage": "icons/header.bmp",
        "sidebarImage": "icons/sidebar.bmp"
      }
    }
  }
}
```

### Installations-Schritte
1. **Willkommen** - Begrüßungstext
2. **Lizenzvereinbarung** - AGB akzeptieren
3. **Lizenzcode** - Eingabe des Aktivierungscodes
4. **Installationsort** - Zielordner wählen
5. **Installation** - Dateien kopieren
6. **Fertig** - Option "App jetzt starten"

---

## 2. Lizenzsystem

### Optionen

#### Option A: Einfach (Kostenlos)
- Keine Lizenzprüfung
- App ist kostenlos nutzbar

#### Option B: Mittel (Empfohlen)
- Lizenzcode wird bei Registrierung generiert
- Code wird gegen einfachen API-Endpunkt validiert
- Keine Hardware-Bindung (einfach zu handhaben)

#### Option C: Komplett (Für Verkauf)
- Hardware-ID basierte Bindung
- Ablaufdatum für Lizenzen
- Widerrufssystem

### Implementierung für Option B

**Ablauf:**
```
Benutzer registriert sich → Admin vergibt Lizenzcode →
Code wird in App eingegeben → App validiert gegen API →
Bei Erfolg: App nutzbar
```

**API-Endpunkte:**
```
POST /api/licenses/validate
  Body: { "code": "XXXX-XXXX-XXXX-XXXX" }
  Response: { "valid": true, "userId": "...", "expiresAt": "..." }

POST /api/licenses/generate
  Body: { "userEmail": "..." }
  Response: { "code": "XXXX-XXXX-XXXX-XXXX" }
```

**Frontend (Lizenz-Seite):**
- Lizenzcode eingeben
- "Aktivieren" Button
- Bei Erfolg: Token speichern
- Bei Fehler: Fehlermeldung anzeigen

---

## 3. Update-Server

### Architektur

**Komponenten:**
1. **Update-Server** - Hostet die Update-Dateien
2. **App-interne Update-Prüfung** - Tauri Updater
3. **Benachrichtigung** - User wird über Updates informiert

### Optionen für Update-Server

#### Option A: GitHub Releases (Kostenlos, Empfohlen)
- Updates werden als GitHub Release bereitgestellt
- Tauri prüft automatisch gegen GitHub API
- Kein eigener Server nötig

#### Option B: Eigener Server
- Einfacher Webserver (Apache/Nginx)
- JSON-Manifest mit Update-Infos
- Mehr Kontrolle über Updates

### Tauri Updater Konfiguration

```json
// tauri.conf.json
{
  "plugins": {
    "updater": {
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDNBQkZGNjJDM...",
      "endpoints": [
        "https://github.com/USER/REPO/releases/latest/download/latest.json"
      ]
    }
  }
}
```

**Update Manifest (latest.json):**
```json
{
  "version": "1.0.1",
  "notes": "Bug fixes and improvements",
  "pub_date": "2024-01-15T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "...",
      "url": "https://github.com/.../Dashboard%20Suite_1.0.1_x64-setup.exe"
    }
  }
}
```

---

## 4. Verteilung

### Verteilungsmethoden

#### Methode A: Direkter Download (Einfach)
- Installer auf eigener Webseite hosten
- Download-Link teilen
- Updates manuell ankündigen

#### Methode B: GitHub Releases (Kostenlos)
- Release auf GitHub erstellen
- Benutzer laden dort herunter
- Automatische Update-Benachrichtigung

#### Methode C: Autoupdate (Best Experience)
- App prüft beim Start auf Updates
- Download im Hintergrund
- "Update verfügbar" Popup
- Installation beim nächsten Neustart

---

## 5. Technische Umsetzung - Schritte

### Phase 1: Lizenzsystem
- [ ] Datenbank-Modell für Lizenzen erstellen
- [ ] API-Endpunkte für Lizenzverwaltung (Admin)
- [ ] Lizenzvalidierung im Frontend
- [ ] Lizenz-Seite in App integrieren

### Phase 2: Installer anpassen
- [ ] NSIS Custom Pages für Lizenzcode
- [ ] Eigene Icons/Branding
- [ ] Sprachdateien vorbereiten

### Phase 3: Update-System
- [ ] GitHub Releases konfigurieren
- [ ] Tauri Updater Plugin einrichten
- [ ] Auto-Update Check beim Start

### Phase 4: Verteilung
- [ ] Ersten Release erstellen
- [ ] Test-Installation durchführen
- [ ] Update-Pfad testen

---

## Kosten-Übersicht

| Komponente | Kosten |
|------------|-------|
| GitHub (Releases) | Kostenlos |
| Eigener Webspace für Updates | ~5€/Monat |
| Domain | ~12€/Jahr |
| **Gesamt** | **~5-17€/Monat** |

---

## Empfehlung für Dashboard Suite

1. **Lizenzsystem**: Option B (Mittel) - Einfach zu implementieren, ausreichend für private/Business-Nutzung

2. **Update-Server**: Option A (GitHub Releases) - Kostenlos, einfach, zuverlässig

3. **Verteilung**: GitHub Releases mit Auto-Update

---

## Nächste Schritte

1. **Sofort**: VS Build Tools installieren → Desktop-App bauen
2. **Danach**: Lizenzsystem implementieren
3. **Dann**: Update-Server einrichten
4. **Abschließend**: Ersten Release veröffentlichen
