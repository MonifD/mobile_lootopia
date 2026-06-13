# lootopia_mobile

Frontend mobile React Native (Expo) pour le jeu Lootopia.

- Backend: `../lootopia` (projet separe)
- Frontend mobile: `./mobile_lootopia`

## Architecture

- **Auth**: Contexte global `AuthProvider` avec SecureStore + Bearer token
- **Ecrans de jeu**: 3 tabs Expo Router (Chasses, Accomplissements, Profil)
- **API**: Client centralisé avec support ApiPlatform (hydra:member) et erreurs Symfony

## Ecrans inclus

### Auth
- `Login` (`app/(auth)/login.tsx`)
- `Register` (`app/(auth)/register.tsx`)

### Jeu (connecte)
- `Chasses` (`app/(tabs)/index.tsx`) - Liste des hunts disponibles
- `Accomplissements` (`app/(tabs)/explore.tsx`) - Achievements avec rarete coloree
- `Profil` (`app/(tabs)/profile.tsx`) - Profil joueur + stats + deconnexion

## Configuration backend

1. Copier `.env.example` vers `.env`
2. Ajuster `EXPO_PUBLIC_API_URL`

Exemples:

- Android Emulator: `http://10.0.2.2:8000/api`
- iOS Simulator: `http://localhost:8000/api`
- Telephone physique: `http://<IP_DE_TON_PC>:8000/api`

## Lancer le projet

```bash
npm install
npx expo start
```

## Bypass auth (dev)

Pour afficher directement la page d'accueil (tabs) sans login:

1. Ajouter dans `.env`:
	`EXPO_PUBLIC_BYPASS_AUTH=true`
2. Relancer Expo avec cache vide:
	`npx expo start -c`

Pour revenir au comportement normal (ecran de connexion):

- supprimer la variable
- ou mettre `EXPO_PUBLIC_BYPASS_AUTH=false`

## Endpoints backend utilises

### Auth
- `POST /login` - Connexion (email + password) -> token + profil
- `POST /users` - Inscription (email + username + password + city) -> profil

### Jeu authentifie (Bearer token)
- `GET /hunts` -> Hunt[] (chasses disponibles)
- `GET /users/{id}` -> PlayerProfile (profil complet)
- `GET /users/{id}/achievements` -> Achievement[] (accomplissements du joueur)
- `GET /leaderboard/my-rank` -> UserRank (rang + percentile)

### Supports de reponse
- Format direct: `T[]` ou `T`
- Format ApiPlatform: `{ 'hydra:member': T[], ...}`
- Format envelope: `{ data: T }`
