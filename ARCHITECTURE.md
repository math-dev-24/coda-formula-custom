# Architecture Documentation

## Vue d'ensemble

Extension Chrome (Manifest V3) qui personnalise l'editeur de formules Coda. Le popup est une app React 19, le content script est du JavaScript vanilla. Vite + @crxjs/vite-plugin gerent le build.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Popup UI | React 19, JSX, CSS variables |
| Content Script | JavaScript ES6+, MutationObserver, ResizeObserver |
| Build | Vite 7, @crxjs/vite-plugin, @vitejs/plugin-react |
| Stockage | chrome.storage.local |
| Communication | chrome.runtime.onMessage, chrome.tabs.sendMessage |
| Tests | Node test runner |

## Structure des modules

### `src/shared/` — Code partage

Importe par le popup ET le content script. Source unique de verite.

| Module | Responsabilite |
|--------|---------------|
| `config.js` | `DEFAULT_CONFIG`, `PRESET_SNAPSHOT_KEYS`, `validateConfig()`, `mergeConfig()`, `snapshotConfig()` |
| `storage.js` | `StorageManager` : CRUD config, presets custom, notification cross-tabs |

### `src/content/` — Content Script

Injecte dans les pages `coda.io/d/*`. Architecture SOLID avec des managers specialises :

| Classe | Pattern | Responsabilite |
|--------|---------|---------------|
| `ModalCustomizer` | Observer | Point d'entree, MutationObserver sur le DOM |
| `DialogProcessor` | Facade | Orchestre les managers du dialogue |
| `StyleManager` | - | CSS global, inline styles, themes, indent guides |
| `LayoutManager` | - | Flex wrappers, position documentation, reset |
| `ModalSizeManager` | - | Taille et position de la modale |
| `DialogInteractionManager` | - | Drag, resize natif, maximize, dim outside, scroll pass-through |
| `FormulaEditorEnhancer` | - | Folding, no-wrap, scroll horizontal |
| `SidePanelManager` | - | Poignee live du panneau documentation, masquage rapide |
| `DOMSelector` | - | Queries DOM avec selecteurs Coda |

Modules de support :

| Module | Responsabilite |
|--------|---------------|
| `enhancement-styles.js` | Injecte le CSS runtime des interactions directes |
| `session-state.js` | Etat runtime non persistant : taille courante, folds, panneau masque |
| `utils.js` | Helpers purs reutilises par les managers |

### `src/popup/` — Interface React

| Fichier | Role |
|---------|------|
| `App.jsx` | Composant racine, 2 onglets (Custom / Library), 480 px |
| `hooks/useChromeStorage.js` | Hook sync `chrome.storage` ↔ React state + CRUD presets custom |
| `components/Header.jsx` | Header gradient + toggle theme sombre |
| `components/Tabs.jsx` | Barre d'onglets controlee avec badge optionnel |
| `components/SavePresetBar.jsx` | Bouton pliable → input inline pour sauver un preset |
| `components/LibraryPanel.jsx` | Liste des presets custom triee par date de creation |
| `components/PresetCard.jsx` | Carte preset : Apply (clic), Rename (inline), Delete (confirm) |
| `components/Accordion.jsx` | Accordeon reutilisable avec animation |
| `components/ModalSizePanel.jsx` | Sliders taille/position + checkbox transparence |
| `components/EditorSettingsPanel.jsx` | Font size, line height, font family, theme |
| `components/IndentGuidesPanel.jsx` | Toggle guides, style, highlight actif |
| `components/DocumentationPanel.jsx` | Toggle doc, position 4 directions, proportion |
| `components/ActionBar.jsx` | Bouton Reset (visible uniquement dans l'onglet Custom) |
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
│     ├─ DialogInteractionManager.enhance()
│     ├─ StyleManager.applyEditorStyles()
│     ├─ FormulaEditorEnhancer.enhance()
│     └─ LayoutManager.applyLayout()
│        └─ SidePanelManager.attach()
└──────────────────────┘
```

## Build

```bash
npm run dev      # Dev server avec HMR (popup uniquement)
npm test         # Tests unitaires Node
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

Le content script utilise `MutationObserver` sur `document.body` pour detecter l'apparition de nouveaux dialogues. Un `WeakSet` evite de retraiter les dialogues deja personnalises. Les interactions directes utilisent aussi `ResizeObserver` et `AbortController` pour nettoyer les listeners quand la config provoque un reset.

## Fonctionnalites runtime

### Dialogue

- `ModalSizeManager` applique la taille initiale issue du popup.
- `DialogInteractionManager` convertit ensuite le dialogue en surface manipulable : position `fixed`, drag par le header, resize natif, double-clic pour maximiser/restaurer.
- Les clics hors dialogue sont interceptes pour eviter la fermeture involontaire. La modale devient semi-transparente et les evenements wheel sont relayes vers le document sous-jacent.

### Editeur

- `FormulaEditorEnhancer` detecte les lignes `.kr-line` et `.kr-paragraph`.
- Les regions pliables sont calculees par profondeur de parentheses, crochets et accolades, en ignorant les chaines et les commentaires `//`.
- Les etats de fold sont gardes dans `sessionState.foldedRegionsByFormulaHash`, uniquement pour la session de page.
- Les lignes longues utilisent `white-space: pre` et l'editeur garde un scroll horizontal.

### Documentation

- `LayoutManager` cree le wrapper flex selon la position choisie.
- `SidePanelManager` ajoute une poignee entre l'editeur et la documentation.
- Glisser la poignee ajuste la proportion courante. Cliquer sur la poignee ou double-appuyer sur `Cmd` / `Ctrl` masque ou restaure la documentation.

### Presets custom (bibliotheque)

- `snapshotConfig(config)` extrait les champs snapshotables (definis dans `PRESET_SNAPSHOT_KEYS`) pour exclure `customPresets` du snapshot.
- `StorageManager.saveCustomPreset(name)` cree un preset avec un UUID, un timestamp et un snapshot de la config courante.
- `StorageManager.applyCustomPreset(id)` overlay le snapshot sur la config courante en preservant explicitement `customPresets`.
- `StorageManager.exportCustomPresets()` produit un JSON versionne avec la bibliotheque de presets.
- `StorageManager.importCustomPresets(payload)` valide les presets importes et les fusionne avec la bibliotheque existante.
- Le hook `useChromeStorage` expose `saveCustomPreset`, `applyCustomPreset`, `renameCustomPreset`, `deleteCustomPreset`, `exportCustomPresets`, `importCustomPresets`.
- `notifyConfigChange` est appele automatiquement apres chaque operation : le content script recoit toujours le push.

## Principes appliques

1. **SOLID** : une classe = une responsabilite
2. **DRY** : `shared/` elimine toute duplication de config/storage
3. **Composition** : `DialogProcessor` compose `StyleManager`, `LayoutManager`, `ModalSizeManager`
4. **React hooks** : `useChromeStorage` encapsule la logique de sync storage
5. **Early returns** : reduction de la complexite cyclomatique
6. **JSDoc** : documentation sur toutes les classes et methodes publiques
7. **Cleanup explicite** : `AbortController`, `WeakMap` et observers deconnectes au reset
8. **Tests cibles** : logique pure testee sans navigateur pour garder une suite rapide

## Extensibilite

### Ajouter un theme

1. Dans `src/content/style-manager.js`, methode `applyTheme()`, ajouter dans `themes` :

```javascript
mytheme: { bg: '#...', color: '#...' },
```

2. Dans `src/shared/config.js`, ajouter la valeur dans `validThemes`.
3. Dans `src/popup/components/EditorSettingsPanel.jsx`, ajouter l'option dans `THEMES`.

### Ajouter une police

1. Dans `StyleManager.fontMap` : ajouter le mapping
2. Dans `src/content/index.js` : ajouter l'URL de la police dans `FONT_URLS`
3. Dans `src/popup/components/EditorSettingsPanel.jsx` : ajouter l'option dans le select
4. Dans `src/shared/config.js` : ajouter dans `validFonts`

### Ajouter un parametre

1. `src/shared/config.js` : ajouter dans `DEFAULT_CONFIG` + `validateConfig()`. Si le parametre doit etre inclus dans les presets custom, l'ajouter aussi dans `PRESET_SNAPSHOT_KEYS`.
2. Creer ou modifier le composant React dans `src/popup/components/`
3. Implementer la logique dans le content script correspondant
4. Ajouter ou mettre a jour les tests dans `test/`
5. Lancer `npm test && npm run build`
