# Guide de déploiement — claudesan.com/prodal

> Mise en ligne du site Prodal sur AWS avec déploiement automatique via GitHub Actions.

## Architecture cible

```
Visiteur
  → claudesan.com/prodal/
  → Route 53 (DNS)
  → CloudFront (CDN + HTTPS)
  → S3 bucket (claudesan.com/prodal/*)
```

GitHub push → GitHub Actions → S3 sync → invalidation CloudFront.

---

## Étape 1 — Créer le repo GitHub

1. Aller sur **github.com** → bouton **+** en haut à droite → **New repository**
2. Nom : `prodal-site` (ou ce que tu veux)
3. **Public** (recommandé)
4. Ne pas cocher "Add README", "Add .gitignore", "Choose a license" — on a déjà tout
5. Cliquer **Create repository**
6. Sur la page suivante, copier l'URL HTTPS du repo (ex. `https://github.com/TON_USER/prodal-site.git`)

## Étape 2 — Pousser le code

Ouvrir le **Terminal** sur ton Mac (Cmd+Espace → "Terminal") puis :

```bash
cd ~/Desktop/prodal
git init -b main
git add .
git commit -m "Initial commit — site Prodal multilingue"
git remote add origin https://github.com/TON_USER/prodal-site.git
git push -u origin main
```

Si c'est le premier push GitHub depuis ton Mac, GitHub te demandera de t'authentifier (token personnel ou via le navigateur).

## Étape 3 — Créer un bucket S3

1. Console AWS → **S3** → **Create bucket**
2. Nom : `claudesan.com` (le nom doit correspondre exactement au domaine)
3. Région : **eu-west-1 (Ireland)** ou **eu-central-1 (Frankfurt)** — plus proche du Luxembourg
4. **Bloquer tous les accès publics** : laisser activé (CloudFront utilisera OAC)
5. **Versioning** : optionnel, désactivé OK
6. **Encryption** : SSE-S3 (par défaut)
7. Créer le bucket

## Étape 4 — Demander un certificat SSL (ACM)

> Important : le certificat **doit être en us-east-1 (N. Virginia)** pour fonctionner avec CloudFront.

1. En haut à droite, **changer la région en N. Virginia** (us-east-1)
2. Aller sur **Certificate Manager** → **Request certificate**
3. **Public certificate** → Next
4. Domain names :
   - `claudesan.com`
   - `www.claudesan.com`
5. Méthode de validation : **DNS validation** (recommandé)
6. **Request**
7. Sur la page du certificat, noter l'**ARN** complet (commence par `arn:aws:acm:us-east-1:...`)
8. Pour chaque domaine, des CNAME records de validation s'affichent. Tu les ajouteras à Route 53 à l'étape 5.

## Étape 5 — Créer la zone Route 53

1. Console AWS → **Route 53** → **Hosted zones** → **Create hosted zone**
2. Domain name : `claudesan.com`
3. Type : **Public**
4. Créer
5. Sur la page de la zone, noter les 4 **NS records** (nameservers AWS)
6. Cliquer **Create record** pour ajouter chaque CNAME de validation ACM (étape 4)
7. Retourner sur ACM (us-east-1) — au bout de quelques minutes le certificat passe en **Issued**

## Étape 6 — Pointer le domaine vers Route 53

Chez ton registrar (où tu as acheté claudesan.com — OVH, Gandi, GoDaddy, etc.) :

1. Aller dans la gestion DNS du domaine
2. Remplacer les nameservers actuels par les 4 NS de Route 53 (étape 5)
3. Sauvegarder

Délai de propagation : 5 min à 24h selon le registrar.

## Étape 7 — Créer la distribution CloudFront

1. Console AWS → **CloudFront** → **Create distribution**
2. **Origin domain** : sélectionner ton bucket S3 (`claudesan.com.s3.eu-west-1.amazonaws.com`)
3. **Origin access** → **Origin access control settings (recommended)** → **Create new OAC** (laisser les defaults)
4. **Viewer protocol policy** : **Redirect HTTP to HTTPS**
5. **Allowed HTTP methods** : GET, HEAD
6. **Cache policy** : **CachingOptimized**
7. **Alternate domain names (CNAMEs)** :
   - `claudesan.com`
   - `www.claudesan.com`
8. **Custom SSL certificate** : sélectionner le cert ACM (étape 4)
9. **Default root object** : laisser vide (optionnel : `index.html` si tu veux un index racine plus tard)
10. **Create distribution**
11. Sur la page de la distribution, noter le **Distribution domain name** (ex. `dxxxx.cloudfront.net`) et l'**ID** (ex. `E1XXXX`)
12. CloudFront affichera une **policy à copier dans la bucket policy S3** — clique **Copy policy** puis va sur S3 → ton bucket → onglet **Permissions** → **Bucket policy** → **Edit** → coller → Save

## Étape 8 — Créer les records DNS dans Route 53

1. Route 53 → ton hosted zone claudesan.com → **Create record**
2. Record name : (vide, racine du domaine)
3. Type : **A**
4. **Alias** : ON
5. Route traffic to : **Alias to CloudFront distribution** → sélectionner ta distribution
6. Create record

Refaire pour `www.claudesan.com` (Record name = `www`).

## Étape 9 — Créer un IAM user pour GitHub Actions

1. Console AWS → **IAM** → **Users** → **Create user**
2. Nom : `github-actions-prodal`
3. Pas de console access (juste API)
4. **Attach policies directly** → **Create policy** :
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket", "s3:GetObject"],
         "Resource": [
           "arn:aws:s3:::claudesan.com",
           "arn:aws:s3:::claudesan.com/prodal/*"
         ]
       },
       {
         "Effect": "Allow",
         "Action": ["cloudfront:CreateInvalidation"],
         "Resource": "arn:aws:cloudfront::TON_COMPTE:distribution/TA_DISTRIBUTION_ID"
       }
     ]
   }
   ```
5. Attacher la policy à l'utilisateur, créer
6. Onglet **Security credentials** → **Create access key** → type **Application running outside AWS**
7. Noter `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` — **ils ne s'affichent qu'une seule fois**

## Étape 10 — Configurer GitHub Secrets

Sur GitHub → ton repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**, ajouter :

| Nom | Valeur |
|-----|--------|
| `AWS_ACCESS_KEY_ID` | (étape 9) |
| `AWS_SECRET_ACCESS_KEY` | (étape 9) |
| `AWS_REGION` | `eu-west-1` (la région de ton bucket) |
| `S3_BUCKET` | `claudesan.com` |
| `S3_PREFIX` | `prodal` |
| `CLOUDFRONT_DISTRIBUTION_ID` | (étape 7) |

## Étape 11 — Déclencher le premier déploiement

```bash
cd ~/Desktop/prodal
git commit --allow-empty -m "Trigger first deploy"
git push
```

Aller sur GitHub → onglet **Actions** → suivre le workflow. Si tout est vert, le site est en ligne.

## Étape 12 — Vérifier

Ouvrir https://claudesan.com/prodal/ dans un navigateur.

> ⚠ Si tu viens de mettre à jour les nameservers (étape 6), la propagation peut prendre quelques heures. Tu peux tester avant via le domaine CloudFront (https://dxxxx.cloudfront.net/prodal/).

---

## Maintenance quotidienne

À partir de maintenant, pour publier une modification :

```bash
cd ~/Desktop/prodal
# faire tes modifs
git add .
git commit -m "Mise à jour du contenu"
git push
```

Le déploiement est automatique. Tu peux suivre l'avancement dans l'onglet **Actions** du repo GitHub.
