import { NOMS_CENTRES } from './calcul.js';

export const TEXTES_FIABILITE = {
  net: 'Résultat net : ton type principal se détache de 4 points ou plus.',
  'à confirmer': 'Résultat à confirmer : le 2e type est proche (moins de 4 points d\'écart). Il peut aussi te correspondre.',
  départagé: 'Résultat départagé : plusieurs types étaient à égalité, tu as choisi celui qui te correspond le mieux.'
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
    fiabilite: resultat.fiabilite,
    texteFiabilite: TEXTES_FIABILITE[resultat.fiabilite],
    second,
    nomSecond: questionnaire.types[second].nom,
    nomCentre: NOMS_CENTRES[infos.centre],
    maxType: resultat.maxType,
    maxCentre: resultat.maxCentre,
    classement: resultat.classement.map(t => ({
      type: t,
      nom: questionnaire.types[t].nom,
      score: resultat.scores[t],
      pourcentage: resultat.pourcentages[t]
    })),
    centres: Object.entries(resultat.centres).map(([c, score]) => ({
      nom: NOMS_CENTRES[c],
      score,
      pourcentage: Math.round(score / resultat.maxCentre * 100)
    }))
  };
}
