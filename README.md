# Coda Formula Customizer 🎨

Extension Chrome pour personnaliser l'éditeur de formules Coda.

## ✨ Fonctionnalités

- **Taille personnalisable** : Ajustez la largeur et hauteur de la modal (50% à 95%)
- **Préréglages rapides** : 3 presets prédéfinis (Défaut, Moyen, Plein écran)
- **Position de la documentation** : Choisissez où afficher la documentation
  - Gauche
  - Droite
  - Haut
  - Bas
  - Masquée
- **Proportions ajustables** : Contrôlez la taille relative de l'éditeur vs documentation (30% à 80%)
- **Interface moderne** : Design épuré et intuitif
- **Sauvegarde automatique** : Vos préférences sont conservées

## 🚀 Installation

### Installation manuelle (développement)

1. Clonez ce dépôt ou téléchargez les fichiers
2. Ouvrez Chrome et allez à `chrome://extensions/`
3. Activez le "Mode développeur" (en haut à droite)
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier `formula-coda-extend`

## 📖 Utilisation

1. Cliquez sur l'icône de l'extension dans la barre d'outils Chrome
2. Ajustez les paramètres selon vos préférences :
   - Utilisez les préréglages pour une configuration rapide
   - Ajustez les sliders pour une personnalisation fine
   - Cochez/décochez "Afficher la documentation" pour la masquer
   - Choisissez la position de la documentation
3. Cliquez sur "Sauvegarder"
4. Ouvrez ou rafraîchissez une page Coda avec des formules

## 🏗️ Architecture

```
formula-coda-extend/
├── manifest.json              # Configuration de l'extension
├── src/
│   ├── config/
│   │   └── defaults.js       # Configuration par défaut
│   ├── core/
│   │   ├── storage.js        # Gestion du stockage (ACID)
│   │   └── modalCustomizer.js # Logique de customisation
│   ├── popup/
│   │   ├── popup.html        # Interface utilisateur
│   │   ├── popup.css         # Styles
│   │   └── popup.js          # Contrôleur de l'interface
│   └── content.js            # Script injecté dans Coda
└── mode/                      # Ancien code (à supprimer)
```

### Principes de conception

- **SOLID** : Chaque module a une responsabilité unique
- **DRY** : Réutilisation du code via des modules
- **ACID** : Stockage fiable avec validation
  - **Atomicity** : Les opérations sont complètes ou échouent
  - **Consistency** : Validation avant sauvegarde
  - **Isolation** : Source unique de vérité
  - **Durability** : Stockage persistant

## 🔧 Configuration

### Paramètres disponibles

```javascript
{
  modalWidth: 95,              // 50-95%
  modalHeight: 95,             // 50-95%
  showDocumentation: true,     // true/false
  documentationPosition: 'right', // 'left', 'right', 'top', 'bottom', 'none'
  editorProportion: 66         // 30-80%
}
```

### Préréglages

| Preset | Largeur | Hauteur | Proportion |
|--------|---------|---------|------------|
| Défaut | 80% | 80% | 66% |
| Moyen | 90% | 90% | 60% |
| Plein écran | 95% | 95% | 70% |

## 🛠️ Développement

### Structure des modules

#### `defaults.js`
Configuration par défaut et validation

#### `storage.js`
Gestion du stockage avec principes ACID
- Lecture/écriture dans `chrome.storage.local`
- Validation des données
- Notification des changements

#### `modalCustomizer.js`
Logique principale de customisation
- Détection des modales de formule
- Application des styles
- Layouts horizontal et vertical
- Observer pattern pour la réactivité

#### `popup.js`
Contrôleur de l'interface utilisateur
- Gestion des événements
- Synchronisation avec le stockage
- Feedback utilisateur

## 📝 Notes techniques

### Compatibilité
- Chrome 88+
- Manifest V3
- ES6 Modules

### Permissions
- `storage` : Sauvegarde des préférences
- `tabs` : Communication avec les onglets Coda

### Sélecteurs Coda
L'extension cible les éléments suivants :
- Dialogs : `div[data-coda-ui-id="dialog"][role="dialog"]`
- Éditeur : `div[data-coda-ui-id="formula-editor"]`
- Items de résultat : `[data-coda-ui-id="result-list-item"]`

## 🐛 Dépannage

### L'extension ne fonctionne pas
1. Vérifiez que vous êtes sur une page Coda (`coda.io/d/*`)
2. Rafraîchissez la page
3. Vérifiez la console développeur (F12) pour les erreurs

### Les changements ne s'appliquent pas
1. Cliquez sur "Sauvegarder" dans le popup
2. Rafraîchissez la page Coda
3. Ouvrez une nouvelle modale de formule

### Réinitialisation
Cliquez sur "Réinitialiser" dans le popup pour revenir aux paramètres par défaut

## 📄 Licence

MIT License

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

## 📧 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.

---

Made with ❤️ for Coda users
