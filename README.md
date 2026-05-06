# Prodal — Site officiel

Site multilingue (FR / LU / DE) de **Prodal Sàrl**, spécialiste du béton décoratif au Luxembourg.

## Structure

```
.
├── index.html          Accueil
├── services.html       Finitions (lissé, brossé, semi-poli, lavé, industriel, lithium)
├── apropos.html        À propos
├── contact.html        Contact + formulaire
└── assets/
    ├── css/style.css
    ├── js/main.js
    ├── js/translations.js
    └── images/         (logo + 22 photos)
```

## Développement local

Aucun build requis — pur HTML/CSS/JS. Pour tester :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Déploiement

Déploiement automatique via GitHub Actions (`.github/workflows/deploy.yml`) :
chaque push sur `main` synchronise le contenu vers S3 et invalide le cache CloudFront.

Secrets GitHub à configurer :
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (ex. `eu-west-1`)
- `S3_BUCKET` (nom du bucket)
- `S3_PREFIX` (ex. `prodal`)
- `CLOUDFRONT_DISTRIBUTION_ID` (optionnel, pour l'invalidation)

## Multilingue

Détection auto de la langue navigateur (lb/lu → LU, de → DE, sinon FR).
Choix mémorisé en localStorage. 154 clés × 3 langues dans `assets/js/translations.js`.
