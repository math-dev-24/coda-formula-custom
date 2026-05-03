# Coda Formula Customizer

Extension Chrome (Manifest V3) pour personnaliser l'editeur de formules Coda. Redimensionnez la modale, ajustez les polices, appliquez des themes et controlez le panneau de documentation.

## Fonctionnalites

### Modale

- **Taille** : largeur et hauteur reglables de 20 % a 98 %
- **Position** : deplacement horizontal (0-100 %) et vertical (0-100 %)
- **Drag & resize live** : glisser la modale par son header, redimensionner depuis le coin inferieur droit
- **Maximiser / restaurer** : double-cliquer sur le header
- **Consultation du document** : cliquer hors modale ne ferme plus le dialogue, mais rend la modale semi-transparente et permet de scroller la page Coda derriere
- **Bouton X** : repositionnement du bouton de fermeture pour rester aligne
- **Fond transparent** : suppression du fond gris derriere la modale
- **Presets** : configuration rapide (Defaut, Moyen, Plein ecran)

### Editeur

- **Folding** : plier / deplier les blocs de formule imbriques avec les controles dans la gouttiere
- **Lignes longues** : pas de retour automatique a la ligne, scroll horizontal dans l'editeur
- **Taille de police** : de 10 a 24 px
- **Hauteur de ligne** : de 1.0 a 2.5
- **Polices** : Monospace, Fira Code, JetBrains Mono, Source Code Pro, OpenDyslexic
- **Themes** : Light, Dark, Sepia, High Contrast, Protanopia, Deuteranopia, Tritanopia
- **Guides d'indentation** : lignes rainbow avec styles solid/dotted/dashed et surbrillance de l'indent actif

### Documentation

- **Afficher / masquer** le panneau de documentation
- **Position** : Gauche, Droite, Haut, Bas
- **Proportion** : ratio editeur / documentation reglable de 30 % a 80 %
- **Resize live** : poignee entre l'editeur et la documentation
- **Masquage rapide** : clic sur la poignee ou double appui sur `Cmd` / `Ctrl`

## Stack technique

| Technologie | Usage |
|-------------|-------|
| **React 19** | Interface popup |
| **Vite 7** | Build et dev server |
| **@crxjs/vite-plugin** | Integration Chrome Extension |
| **JavaScript ES6+** | Content script (vanilla) |
| **Chrome Extension Manifest V3** | APIs Chrome |

## Installation

### Mode developpement

```bash
git clone <repo-url>
cd formula-coda-extend
npm install
npm run dev
```

Puis dans Chrome :
1. Ouvrir `chrome://extensions/`
2. Activer le **Mode developpeur**
3. Cliquer sur **Charger l'extension non empaquetee**
4. Selectionner le dossier `dist/` genere par Vite

### Build de production

```bash
npm run build
```

Le dossier `dist/` contient l'extension prete a etre chargee dans Chrome.

### Tests

```bash
npm test
```

Les tests utilisent le runner natif Node et couvrent la logique pure des helpers, du folding et du panneau de documentation.

## Architecture

```
formula-coda-extend/
├── manifest.json                 # Chrome Extension Manifest V3
├── package.json                  # Dependances et scripts npm
├── vite.config.js                # Configuration Vite + CRXJS
├── icons/                        # Icones SVG de l'extension
│
└── src/
    ├── shared/                   # Modules partages (popup + content)
    │   ├── config.js             # DEFAULT_CONFIG, validateConfig, mergeConfig
    │   └── storage.js            # StorageManager (ACID)
    │
    ├── content/                  # Content script (injecte dans Coda)
    │   ├── index.js              # Point d'entree
    │   ├── style-manager.js      # Gestion CSS, polices, themes
    │   ├── dom-selector.js       # Selection d'elements DOM Coda
    │   ├── modal-size-manager.js # Taille et position de la modale
    │   ├── dialog-interaction-manager.js # Drag, resize, maximize, dim outside
    │   ├── formula-editor-enhancer.js    # Folding et lignes longues sans wrap
    │   ├── side-panel-manager.js         # Poignee documentation + toggles rapides
    │   ├── enhancement-styles.js         # CSS runtime injecte par le content script
    │   ├── session-state.js              # Etat runtime non persistant
    │   ├── utils.js                      # Helpers DOM/nombres
    │   ├── layout-manager.js     # Disposition de la documentation
    │   ├── dialog-processor.js   # Orchestration (pattern Facade)
    │   └── modal-customizer.js   # Observation DOM (MutationObserver)
    │
    └── popup/                    # Interface utilisateur (React)
        ├── index.html            # HTML shell
        ├── main.jsx              # Point d'entree React
        ├── App.jsx               # Composant racine
        ├── App.css               # Styles (CSS variables, dark theme)
        ├── hooks/
        │   └── useChromeStorage.js  # Hook sync chrome.storage <-> React
        └── components/
            ├── Header.jsx        # Header + theme toggle
            ├── PresetSelector.jsx # Presets rapides
            ├── Accordion.jsx     # Accordeon reutilisable
            ├── ModalSizePanel.jsx
            ├── EditorSettingsPanel.jsx
            ├── IndentGuidesPanel.jsx
            ├── DocumentationPanel.jsx
            ├── ActionBar.jsx     # Boutons Save / Reset
            └── StatusMessage.jsx # Toast de statut
```

### Principes

- **SOLID** : chaque classe a une responsabilite unique
- **DRY** : modules partages (`shared/`) eliminent toute duplication
- **Composition > Heritage** : les classes composent leurs dependances
- **React hooks** : logique reutilisable via hooks custom

### Flux de donnees

```
Popup (React) → useChromeStorage hook
              → StorageManager.saveConfig()
              → chrome.storage.local
              → StorageManager.notifyConfigChange()
              → Content Script: ModalCustomizer.updateConfig()
                  → DialogProcessor (reset + reprocess)
                      ├── ModalSizeManager.applySize()
                      ├── DialogInteractionManager.enhance()
                      ├── StyleManager.applyEditorStyles()
                      ├── FormulaEditorEnhancer.enhance()
                      └── LayoutManager.applyLayout()
                          └── SidePanelManager.attach()
```

## Configuration

### Parametres

```javascript
{
  modalWidth: 95,                  // 20-98 %
  modalHeight: 95,                 // 20-98 %
  modalLeft: 50,                   // 0-100 % (50 = centre)
  modalTop: 50,                    // 0-100 % (50 = centre)
  transparentBackground: false,
  showDocumentation: true,
  documentationPosition: 'right',  // left | right | top | bottom | none
  editorProportion: 66,            // 30-80 %
  editorFontSize: 14,              // 10-24 px
  editorLineHeight: 1.5,           // 1.0-2.5
  editorFontFamily: 'monospace',   // monospace | fira-code | jetbrains-mono | source-code-pro | opendyslexic
  editorTheme: 'light',            // light | dark | sepia | high-contrast | protanopia | deuteranopia | tritanopia
  showIndentGuides: true,
  indentGuideStyle: 'dotted',      // solid | dotted | dashed
  highlightActiveIndent: true
}
```

### Presets

| Preset | Largeur | Hauteur | Proportion editeur |
|--------|---------|---------|-------------------|
| Defaut | 80 % | 80 % | 66 % |
| Moyen | 90 % | 90 % | 60 % |
| Plein ecran | 95 % | 95 % | 70 % |

## Developpement

### Scripts npm

| Script | Description |
|--------|-------------|
| `npm run dev` | Lancement du dev server Vite avec HMR |
| `npm run build` | Build de production dans `dist/` |
| `npm test` | Tests unitaires avec le runner natif Node |
| `npm run preview` | Preview du build de production |

### Ajouter une fonctionnalite

1. Ajouter la propriete dans `src/shared/config.js` (`DEFAULT_CONFIG` + `validateConfig`)
2. Ajouter le controle dans le composant React correspondant (`src/popup/components/`)
3. Implementer la logique dans le content script (`src/content/`)
4. Ajouter ou ajuster les tests dans `test/`
5. `npm test && npm run build` pour verifier

### Selecteurs DOM Coda

```css
div[data-coda-ui-id="dialog"][role="dialog"]   /* Modale de formule */
div[data-coda-ui-id="formula-editor"]          /* Editeur de formule */
[data-coda-ui-id="result-list-item"]           /* Items de resultat */
```

## Depannage

| Probleme | Solution |
|----------|---------|
| L'extension ne fonctionne pas | Verifier que la page est sur `coda.io/d/*`, rafraichir la page |
| Les changements ne s'appliquent pas | Rafraichir la page Coda, ouvrir une nouvelle modale de formule |
| Reinitialisation | Cliquer sur "Reset" dans le popup |

## Compatibilite

- Chrome 88+ (Manifest V3)
- Permissions : `storage`, `activeTab`
- Host permissions : `*://*.coda.io/*`

## Licence

MIT
