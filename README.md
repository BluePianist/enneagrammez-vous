# Enneagrammez-vous

Web app qui détermine ton type ennéagramme à l'aide d'un questionnaire de 27 affirmations.
Elle fonctionne sur ordinateur et sur téléphone, entièrement dans le navigateur : aucune réponse n'est stockée ni envoyée.
À la fin du test, un récapitulatif du profil peut être téléchargé en PDF (généré dans le navigateur).

## Lancer l'app en local

Prérequis : [Node.js](https://nodejs.org) 20 ou plus récent.

```sh
npm install
npm run dev      # serveur de développement sur http://localhost:5173
```

Pour tester depuis un téléphone sur le même réseau Wi‑Fi : `npm run dev -- --host`, puis ouvrez l'adresse « Network » affichée.

Autres commandes :

```sh
npm test         # tests du calcul du type
npm run build    # version de production dans dist/ (fichiers statiques)
npm run preview  # sert la version de production
```

## Où sont les choses

- `src/data/questionnaire.json` : questions, échelle, descriptions des types et règle de calcul.
- `src/lib/calcul.js` : calcul du type principal, de l'aile, des centres et de la fiabilité.
- `src/lib/pdf.js` : génération du récapitulatif PDF (jsPDF).
- `src/App.jsx` : les écrans (accueil, questions, résultats).
