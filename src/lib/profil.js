import { NOMS_CENTRES } from './calcul.js';

export const TEXTES_FIABILITE = {
  net: 'Résultat net : ton type principal se détache de plus de 25 points.',
  'à confirmer': 'Résultat à confirmer : le 2e type est proche (25 points d\'écart ou moins). Il peut aussi te correspondre.',
  départagé: 'Résultat départagé : plusieurs types étaient très proches, tu as choisi celui qui te correspond le mieux.'
};

// Assemble ce qu'on affiche (écran et PDF) à partir du résultat final du calcul
// (après appliquerDepartage en cas d'ex æquo). Renvoie null tant qu'il reste à départager.
export function construireProfil(questionnaire, resultat) {
  const { typePrincipal: type, aile } = resultat;
  if (type == null) return null;
  const infos = questionnaire.types[type];
  const second = resultat.classement.find(t => t !== type);
  return {
    type,
    aile,
    infos,
    nomAile: aile ? questionnaire.types[aile].nom : null,
    // Part de l'aile dans le couple type + aile (0 = pile sur le type, 0,5 = à mi-chemin).
    poidsAile: aile ? poidsAile(resultat.pourcentages[type], resultat.pourcentages[aile]) : 0,
    fiabilite: resultat.fiabilite,
    texteFiabilite: TEXTES_FIABILITE[resultat.fiabilite],
    second,
    nomSecond: questionnaire.types[second].nom,
    nomCentre: NOMS_CENTRES[infos.centre],
    classement: resultat.classement.map(t => ({
      type: t,
      nom: questionnaire.types[t].nom,
      pourcentage: resultat.pourcentages[t]
    })),
    centres: Object.entries(resultat.centres).map(([c, pourcentage]) => ({
      nom: NOMS_CENTRES[c],
      pourcentage
    }))
  };
}

function poidsAile(scoreType, scoreAile) {
  const total = scoreType + scoreAile;
  return total === 0 ? 0 : Math.min(0.5, scoreAile / total);
}
