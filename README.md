# AutoBenin — Location de voitures

# 🇧🇯 AutoBénin — Location de voitures entre particuliers

> La première plateforme de location de voitures entre particuliers au Bénin.

🌐 **Site en ligne** : [autobenin.vercel.app](https://autobenin.vercel.app)

---

## 📋 À propos

AutoBénin connecte les propriétaires de véhicules avec des locataires au Bénin. Les propriétaires publient leurs voitures, les locataires réservent et paient via Mobile Money (MTN MoMo / Moov Money). AutoBénin prélève une commission de 15% sur chaque transaction.

---

## ✨ Fonctionnalités

### 👤 Utilisateurs
- Inscription en 3 étapes (infos → rôle → documents)
- Connexion avec redirection automatique selon le rôle
- Profil complet avec historique des réservations
- Système d'avis et de notes (⭐ 1-5 étoiles)

### 🚗 Voitures
- Publication d'annonces avec photos (Cloudinary)
- Filtres avancés : ville, type, carburant, prix, places
- Badge **🎉 Sans caution** pour les voitures sans dépôt
- Galerie photos avec lightbox
- Page de recherche avancée

### 📋 Réservations
- Réservation avec sélection de dates
- Paiement via Mobile Money (MTN MoMo / Moov Money)
- Instructions de paiement automatiques par email
- Confirmation par l'admin après réception du paiement
- Contrats PDF générés automatiquement

### 💰 Finance
- Commission automatique de 15% sur chaque location
- Dashboard financier pour l'admin
- Portefeuille pour les propriétaires
- Historique complet des transactions

### 🛡 Administration
- Dashboard admin complet
- Gestion des utilisateurs (vérifier, suspendre, réintégrer)
- Approbation des voitures
- Gestion des litiges
- Confirmation des paiements

### 📧 Notifications
- Email de bienvenue à l'inscription
- Email avec instructions de paiement
- Email de confirmation de réservation
- Email de paiement reçu

---

## 🛠 Stack technique

### Frontend
- **React** + Vite
- **React Router** v6
- **CSS** inline + responsive (mobile-first)
- Déployé sur **Vercel**

### Backend
- **Node.js** + Express
- **MongoDB** Atlas + Mongoose
- **JWT** pour l'authentification
- **Cloudinary** pour les photos
- **Nodemailer** + Gmail pour les emails
- **PDFKit** pour les contrats PDF
- Déployé sur **Render**

---

## 🚀 Installation locale

### Prérequis
- Node.js v18+
- MongoDB (local ou Atlas)
- Compte Cloudinary

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Remplis les variables dans .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# Crée un fichier .env.local avec :
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

## 🔧 Variables d'environnement

### Backend (`backend/.env`)
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=ton_secret_jwt
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GMAIL_USER=ton@gmail.com
GMAIL_APP_PASSWORD=...
FRONTEND_URL=https://autobenin.vercel.app
NODE_ENV=production
```

### Frontend (`frontend/.env.production`)
```env
VITE_API_URL=https://autobenin.onrender.com/api
```

---

## 📱 Pages du site

| Page | URL | Accès |
|------|-----|-------|
| Accueil | `/` | Public |
| Voitures | `/cars` | Public |
| Recherche avancée | `/search` | Public |
| Détail voiture | `/cars/:id` | Public |
| Connexion | `/login` | Public |
| Inscription | `/register` | Public |
| Profil | `/profile` | Connecté |
| Dashboard propriétaire | `/dashboard` | Propriétaire |
| Dashboard admin | `/admin` | Admin |
| Finance | `/finance` | Admin + Propriétaire |

---

## 💳 Flow de paiement

```
Locataire réserve
       ↓
Voit le numéro Mobile Money AutoBénin + reçoit email
       ↓
Envoie le montant via MTN MoMo / Moov Money
       ↓
Admin reçoit l'argent → confirme dans le dashboard
       ↓
Réservation confirmée → emails envoyés aux deux parties
       ↓
Après la location → Admin reverse 85% au propriétaire
```

---

## 🤝 Modèle économique

- **Commission** : 15% prélevée sur chaque location
- **Propriétaire reçoit** : 85% du montant total
- **Caution** : optionnelle, fixée par le propriétaire
- **Paiement** : MTN MoMo / Moov Money (validation manuelle → API automatique à venir)

---

## 📄 Licence

Projet propriétaire — © 2025 AutoBénin. Tous droits réservés.

---

*Développé avec ❤️ pour le Bénin 🇧🇯*


## Demarrage rapide

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Stack
- Frontend : React + Vite + Tailwind CSS
- Backend  : Node.js + Express + MongoDB
- Paiement : MTN MoMo / Moov Money
- Stockage : Cloudinary
- Auth     : JWT
