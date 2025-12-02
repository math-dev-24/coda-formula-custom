# Architecture Documentation

## Vue d'ensemble

Cette extension Chrome personnalise l'éditeur de formules Coda en appliquant des styles personnalisés, en ajustant la taille des modales et en gérant le positionnement de la documentation.

## Principes d'architecture

L'architecture suit les principes **SOLID** :

- **Single Responsibility Principle (SRP)** : Chaque classe a une seule responsabilité
- **Open/Closed Principle** : Ouvert à l'extension, fermé à la modification
- **Liskov Substitution Principle** : Les classes peuvent être remplacées par leurs sous-classes
- **Interface Segregation Principle** : Interfaces spécifiques plutôt que génériques
- **Dependency Inversion Principle** : Dépendre d'abstractions, pas d'implémentations

## Structure des classes

### 1. **StyleManager**
**Responsabilité** : Gestion de tous les styles (polices, thèmes, CSS)

**Méthodes principales** :
- `applyEditorStyles(formulaDiv, config)` - Point d'entrée principal pour appliquer tous les styles
- `injectGlobalStyles(config)` - Injecte des styles CSS globaux dans le DOM
- `applyInlineStyles(formulaDiv, config)` - Applique des styles inline sur le conteneur de la formule
- `applyToEditorElements(formulaDiv, config)` - Applique des styles sur tous les éléments de l'éditeur
- `applyTheme(formulaDiv, config)` - Applique le thème (light, dark, sepia)
- `toggleLineNumbers(formulaDiv, config)` - Affiche/masque les numéros de ligne
- `resetStyles(element)` - Réinitialise les styles d'un élément

**Données** :
- `fontMap` : Mapping des noms de polices vers les valeurs CSS
- `styleElementId` : ID de l'élément style injecté

---

### 2. **DOMSelector**
**Responsabilité** : Sélection et recherche d'éléments DOM

**Méthodes principales** :
- `findDialogs()` - Trouve tous les dialogues de formule
- `findFormulaEditor(dialog)` - Trouve l'éditeur de formule dans un dialogue
- `findRootDiv(dialog)` - Trouve la div racine d'un dialogue
- `findTargetContainer(rootDiv)` - Trouve le conteneur cible pour la manipulation du layout
- `findTargetContainerFallback(rootDiv)` - Méthode de secours pour trouver le conteneur

**Avantages** :
- Centralise toute la logique de sélection DOM
- Facilite les tests et le débogage
- Rend le code plus maintenable

---

### 3. **ModalSizeManager**
**Responsabilité** : Gestion de la taille des modales

**Méthodes principales** :
- `applySize(rootDiv, config)` - Applique la taille configurée à la modale

**Simple et focalisé** : Une seule responsabilité, facile à tester

---

### 4. **LayoutManager**
**Responsabilité** : Gestion du layout et du positionnement de la documentation

**Méthodes principales** :
- `applyLayout(target, kids, formulaDiv, config)` - Point d'entrée principal
- `hideDocumentation(kids)` - Masque le panneau de documentation
- `showDocumentation(target, kids, formulaDiv, config)` - Affiche la documentation avec le bon layout
- `hideIntermediateChildren(kids)` - Masque les enfants intermédiaires
- `createFlexWrapper()` - Crée un conteneur flex
- `arrangeChildren(flexWrapper, mainChild, sideChild, config)` - Arrange les enfants selon la position
- `adjustSideChildLayout(sideRoot)` - Ajuste le layout du panneau latéral
- `observeSideChild(sideChild)` - Observe les changements DOM du panneau latéral
- `resetLayout(target)` - Réinitialise le layout à l'état original

**Complexité maîtrisée** : Divise la logique complexe de layout en méthodes simples et testables

---

### 5. **DialogProcessor**
**Responsabilité** : Orchestration de la personnalisation des dialogues

**Dépendances** :
- `DOMSelector` : Pour trouver les éléments
- `StyleManager` : Pour appliquer les styles
- `ModalSizeManager` : Pour ajuster la taille
- `LayoutManager` : Pour gérer le layout

**Méthodes principales** :
- `processDialog(dialog, formulaDiv)` - Traite un dialogue complet
- `resetDialog(dialog)` - Réinitialise un dialogue à son état original

**Pattern Facade** : Fournit une interface simple pour coordonner plusieurs systèmes complexes

---

### 6. **ModalCustomizer**
**Responsabilité** : Point d'entrée principal, observation et coordination de haut niveau

**Dépendances** :
- `DOMSelector` : Pour trouver les dialogues
- `DialogProcessor` : Pour traiter les dialogues

**Méthodes principales** :
- `init()` - Initialise le customizer
- `updateConfig(newConfig)` - Met à jour la configuration
- `processDialogs()` - Traite tous les dialogues du DOM
- `startObserver()` - Démarre l'observation du DOM
- `stopObserver()` - Arrête l'observation

**Pattern Observer** : Observe le DOM pour détecter les nouveaux dialogues

---

### 7. **StorageManager**
**Responsabilité** : Gestion du stockage de la configuration

**Méthodes principales** :
- `getConfig()` - Récupère la configuration
- `saveConfig(config)` - Sauvegarde la configuration
- `applyPreset(presetName)` - Applique un préréglage
- `resetToDefaults()` - Réinitialise aux valeurs par défaut
- `notifyConfigChange(config)` - Notifie les changements de configuration
- `onConfigChange(callback)` - Écoute les changements de configuration

---

## Flux de données

```
User Action (Popup)
       ↓
StorageManager.saveConfig()
       ↓
Chrome Storage API
       ↓
StorageManager.notifyConfigChange()
       ↓
ModalCustomizer.updateConfig()
       ↓
DialogProcessor.resetDialog() (pour tous les dialogues)
       ↓
DialogProcessor.processDialog() (re-traiter avec nouvelle config)
       ↓
├── ModalSizeManager.applySize()
├── StyleManager.applyEditorStyles()
└── LayoutManager.applyLayout()
```

## Flux de traitement d'un dialogue

```
ModalCustomizer détecte un nouveau dialogue (via MutationObserver)
       ↓
DOMSelector.findFormulaEditor()
       ↓
DialogProcessor.processDialog()
       ↓
├── DOMSelector.findRootDiv()
├── DOMSelector.findTargetContainer()
       ↓
├── ModalSizeManager.applySize()
       ↓
├── StyleManager.applyEditorStyles()
│   ├── injectGlobalStyles()
│   ├── applyInlineStyles()
│   ├── applyToEditorElements()
│   ├── applyTheme()
│   └── toggleLineNumbers()
       ↓
└── LayoutManager.applyLayout()
    ├── hideDocumentation() OU
    └── showDocumentation()
        ├── createFlexWrapper()
        ├── arrangeChildren()
        ├── adjustSideChildLayout()
        └── observeSideChild()
```

## Avantages de cette architecture

### 1. **Maintenabilité**
- Chaque classe a une responsabilité claire
- Facile de localiser et corriger les bugs
- Code auto-documenté avec JSDoc

### 2. **Testabilité**
- Chaque classe peut être testée indépendamment
- Injection de dépendances facilite les mocks
- Méthodes courtes et focalisées

### 3. **Extensibilité**
- Facile d'ajouter de nouveaux thèmes (modifier StyleManager)
- Facile d'ajouter de nouvelles positions de documentation (modifier LayoutManager)
- Facile d'ajouter de nouveaux types de dialogues (modifier DOMSelector)

### 4. **Réutilisabilité**
- StyleManager peut être réutilisé pour d'autres éditeurs
- DOMSelector peut être étendu pour d'autres sélecteurs
- LayoutManager peut gérer d'autres types de layouts

### 5. **Performance**
- Styles globaux injectés une seule fois
- Utilisation de WeakSet pour éviter le retraitement
- MutationObserver ciblé et efficace

## Exemples d'extension

### Ajouter un nouveau thème

```javascript
// Dans StyleManager.applyTheme()
const themes = {
  dark: { bg: '#1e1e1e', color: '#d4d4d4' },
  sepia: { bg: '#f4ecd8', color: '#5b4636' },
  light: { bg: '#ffffff', color: '#000000' },
  // Nouveau thème
  solarized: { bg: '#002b36', color: '#839496' }
};
```

### Ajouter une nouvelle police

```javascript
// Dans StyleManager constructor
this.fontMap = {
  'monospace': 'monospace',
  'fira-code': '"Fira Code", "Cascadia Code", monospace',
  'jetbrains-mono': '"JetBrains Mono", monospace',
  'source-code-pro': '"Source Code Pro", monospace',
  // Nouvelle police
  'cascadia-code': '"Cascadia Code", monospace'
};
```

### Ajouter une nouvelle position de documentation

```javascript
// Dans LayoutManager.arrangeChildren()
// Ajouter un cas pour 'center' par exemple
if (position === 'center') {
  // Logique pour centrer la documentation
}
```

## Bonnes pratiques appliquées

1. **Nommage explicite** : Les noms de classes et méthodes décrivent clairement leur fonction
2. **JSDoc complet** : Toutes les classes et méthodes publiques sont documentées
3. **Gestion d'erreurs** : Try/catch et fallbacks pour la robustesse
4. **Early returns** : Réduction de la complexité cyclomatique
5. **Constantes** : Évite la duplication de valeurs magiques
6. **Immutabilité** : Configuration passée en paramètre, pas modifiée
7. **Composition sur héritage** : Les classes composent leurs dépendances

## Métriques de qualité

- **Couplage** : Faible (chaque classe a peu de dépendances)
- **Cohésion** : Élevée (chaque méthode contribue à la responsabilité de la classe)
- **Complexité** : Réduite (méthodes courtes, logique simple)
- **Duplication** : Éliminée (code réutilisable centralisé)

## Conclusion

Cette architecture modulaire et bien structurée permet un développement rapide, une maintenance facile et une extensibilité maximale. Elle respecte les principes SOLID et les bonnes pratiques de développement logiciel.
