# Architecture Documentation

## Vue d'ensemble

Extension Chrome (Manifest V3) qui personnalise l'editeur de formules Coda. Le popup est une app React 19, le content script est du JavaScript vanilla. Vite + @crxjs/vite-plugin gerent le build.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Popup UI | React 19, JSX, CSS variables |
| Content Script | JavaScript ES6+, MutationObserver |
| Build | Vite 5, @crxjs/vite-plugin, @vitejs/plugin-react |
| Stockage | chrome.storage.local |
| Communication | chrome.runtime.onMessage, chrome.tabs.sendMessage |

## Structure des modules

### `src/shared/` — Code partage

Importe par le popup ET le content script. Source unique de verite.

| Module | Responsabilite |
|--------|---------------|
| `config.js` | `DEFAULT_CONFIG`, `validateConfig()`, `mergeConfig()` |
| `storage.js` | `StorageManager` : CRUD config, presets, notification cross-tabs |

### `src/content/` — Content Script

Injecte dans les pages `coda.io/d/*`. Architecture SOLID avec 6 classes :

| Classe | Pattern | Responsabilite |
|--------|---------|---------------|
| `ModalCustomizer` | Observer | Point d'entree, MutationObserver sur le DOM |
| `DialogProcessor` | Facade | Orchestre les 3 managers ci-dessous |
| `StyleManager` | - | CSS global, inline styles, themes, indent guides |
| `LayoutManager` | - | Flex wrappers, position documentation, reset |
| `ModalSizeManager` | - | Taille et position de la modale |
| `DOMSelector` | - | Queries DOM avec selecteurs Coda |

### `src/popup/` — Interface React

| Fichier | Role |
|---------|------|
| `App.jsx` | Composant racine, state global, composition des panels |
| `hooks/useChromeStorage.js` | Hook sync `chrome.storage` ↔ React state |
| `components/Header.jsx` | Header gradient + toggle theme sombre |
| `components/PresetSelector.jsx` | 3 boutons preset (Default, Medium, Fullscreen) |
| `components/Accordion.jsx` | Accordeon reutilisable avec animation |
| `components/ModalSizePanel.jsx` | Sliders taille/position + checkbox transparence |
| `components/EditorSettingsPanel.jsx` | Font size, line height, font family, theme |
| `components/IndentGuidesPanel.jsx` | Toggle guides, style, highlight actif |
| `components/DocumentationPanel.jsx` | Toggle doc, position 4 directions, proportion |
| `components/ActionBar.jsx` | Boutons Save et Reset |
| `components/StatusMessage.jsx` | Toast de feedback |

## Flux de donnees

```
┌──────────────────────┐
│   Popup (React)      │
│   useChromeStorage   │
└──────────┬───────────┘
           │ saveConfig()
           ▼
┌──────────────────────┐
│  StorageManager      │
│  chrome.storage.local│
└──────────┬───────────┘
           │ notifyConfigChange()
           │ chrome.tabs.sendMessage
           ▼
┌──────────────────────┐
│  Content Script      │
│  ModalCustomizer     │
│    .updateConfig()   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  DialogProcessor     │
│  ├─ resetDialog()    │
│  └─ processDialog()  │
│     ├─ ModalSizeManager.applySize()
│     ├─ StyleManager.applyEditorStyles()
│     └─ LayoutManager.applyLayout()
└──────────────────────┘
```

## Build

```bash
npm run dev      # Dev server avec HMR (popup uniquement)
npm run build    # Production build → dist/
```

Vite + @crxjs/vite-plugin :
- Lit `manifest.json` pour detecter les entry points
- Popup : bundle React avec code splitting
- Content script : bundle IIFE unique
- Copie automatique des icones et du manifest dans `dist/`

## Selecteurs DOM Coda

```css
div[data-coda-ui-id="dialog"][role="dialog"]   /* Modale de formule */
div[data-coda-ui-id="formula-editor"]          /* Editeur de formule */
[data-coda-ui-id="result-list-item"]           /* Items de resultat */
```

Le content script utilise `MutationObserver` sur `document.body` pour detecter l'apparition de nouveaux dialogues. Un `WeakSet` evite de retraiter les dialogues deja personnalises.

## Principes appliques

1. **SOLID** : une classe = une responsabilite
2. **DRY** : `shared/` elimine toute duplication de config/storage
3. **Composition** : `DialogProcessor` compose `StyleManager`, `LayoutManager`, `ModalSizeManager`
4. **React hooks** : `useChromeStorage` encapsule la logique de sync storage
5. **Early returns** : reduction de la complexite cyclomatique
6. **JSDoc** : documentation sur toutes les classes et methodes publiques

## Extensibilite

### Ajouter un theme

Dans `src/content/style-manager.js`, methode `applyTheme()` :

```javascript
const themes = {
  // ... themes existants
  solarized: { bg: '#002b36', color: '#839496' },
};
```

### Ajouter une police

1. Dans `StyleManager.fontMap` : ajouter le mapping
2. Dans `src/content/index.js` : ajouter l'URL de la police dans `FONT_URLS`
3. Dans `src/popup/components/EditorSettingsPanel.jsx` : ajouter l'option dans le select
4. Dans `src/shared/config.js` : ajouter dans `validFonts`

### Ajouter un parametre

1. `src/shared/config.js` : ajouter dans `DEFAULT_CONFIG` + `validateConfig()`
2. Creer ou modifier le composant React dans `src/popup/components/`
3. Implementer la logique dans le content script correspondant
