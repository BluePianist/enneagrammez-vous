import { calculerAile, NOMS_CENTRES } from './calcul.js';

export const TEXTES_FIABILITE = {
  net: 'Résultat net : votre type principal se détache de 4 points ou plus.',
  'à confirmer': 'Résultat à confirmer : le 2e type est proche (0 à 3 points d\'écart). Il peut aussi vous correspondre.',
  'ex æquo': 'Résultat ex æquo : plusieurs types restent à égalité, vous les avez départagés vous-même.'
};

// Assemble ce qu'on affiche (écran et PDF) à partir du résultat du calcul
// et, en cas d'ex æquo, du type choisi par la personne.
export function construireProfil(questionnaire, resultat, typeChoisi) {
  const type = resultat.typePrincipal ?? typeChoisi ?? null;
  if (type == null) return null;
  const aile = resultat.typePrincipal != null ? resultat.aile : calculerAile(resultat.scores, type);
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
