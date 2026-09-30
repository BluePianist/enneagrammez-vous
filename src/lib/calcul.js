// Calcul du type ennéagramme (v2) à partir des réponses au questionnaire.
// Reprise de /questionnaire/calcul-v2.js (règle décrite dans questionnaire-v2.json).
// reponses : objet { idQuestion: valeur 0..4 }. questionnaire : contenu de questionnaire-v2.json.
// Chaque question a des « poids » par type : une réponse peut donc compter pour plusieurs profils.
// Si les premiers types sont trop proches, typePrincipal vaut null et questionDepartage contient
// la question à poser ; on appelle ensuite appliquerDepartage avec le type choisi.

const SEUIL_PROCHE = 15;   // écart (points de score ajusté) sous lequel on pose la question
const SEUIL_FLECHE = 25;   // idem quand les deux premiers sont reliés par une flèche
const BONUS_AILE = 0.5;
const CENTRES = { instinctif: [8, 9, 1], emotionnel: [2, 3, 4], mental: [5, 6, 7] };
const TYPES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function calculerType(questionnaire, reponses) {
  const scores = {}, min = {}, max = {};
  for (const t of TYPES) { scores[t] = 0; min[t] = 0; max[t] = 0; }

  for (const q of questionnaire.questions) {
    const v = reponses[q.id];
    if (!Number.isInteger(v) || v < 0 || v > 4) throw new Error(`Réponse manquante ou invalide pour la question ${q.id}`);
    for (const [t, w] of Object.entries(q.poids)) {
      scores[t] += v * w;
      if (w > 0) max[t] += 4 * w; else min[t] += 4 * w;
    }
  }

  const pourcentages = {};
  for (const t of TYPES) pourcentages[t] = Math.round((scores[t] - min[t]) / (max[t] - min[t]) * 100);

  const ajustes = {};
  // Bonus d'aile : seule une aile plus faible que le type compte (une aile reste secondaire),
  // sinon un type profiterait du score de son voisin dominant.
  for (const t of TYPES) {
    const ailesPlusFaibles = ailes(t).map(a => pourcentages[a]).filter(p => p < pourcentages[t]);
    ajustes[t] = pourcentages[t] + BONUS_AILE * Math.max(0, ...ailesPlusFaibles);
  }

  const classement = [...TYPES].sort((a, b) => ajustes[b] - ajustes[a]);
  const [premier, second] = classement;
  const ecart = ajustes[premier] - ajustes[second];

  const centres = {};
  for (const [c, types] of Object.entries(CENTRES)) centres[c] = Math.round(types.reduce((s, t) => s + pourcentages[t], 0) / 3);

  const resultat = { scores, pourcentages, scoresAjustes: ajustes, classement, centres, exAequo: [] };

  // Types à départager : ceux trop proches du 1er, ou les deux premiers s'ils sont reliés par une flèche.
  let candidats = classement.filter(t => ajustes[premier] - ajustes[t] <= SEUIL_PROCHE).slice(0, 3);
  if (candidats.length < 2 && relies(questionnaire, premier, second) && ecart <= SEUIL_FLECHE) candidats = [premier, second];

  if (candidats.length > 1) {
    const d = questionnaire.departage;
    return {
      ...resultat,
      typePrincipal: null,
      exAequo: candidats,
      fiabilite: 'ex æquo',
      aile: null,
      questionDepartage: {
        question: d.questions[Math.floor(Math.random() * d.questions.length)],
        options: candidats.map(t => ({ type: t, ...d.options[t] }))
      }
    };
  }

  return { ...resultat, typePrincipal: premier, aile: meilleureAile(pourcentages, premier), fiabilite: ecart > SEUIL_FLECHE ? 'net' : 'à confirmer' };
}

// Termine le calcul après la question de départage : typeChoisi est le type de l'option retenue.
export function appliquerDepartage(resultat, typeChoisi) {
  if (!resultat.exAequo.includes(typeChoisi)) throw new Error(`Le type ${typeChoisi} ne fait pas partie des types à départager`);
  const { questionDepartage, ...reste } = resultat;
  return { ...reste, typePrincipal: typeChoisi, aile: meilleureAile(resultat.pourcentages, typeChoisi), fiabilite: 'départagé' };
}

function ailes(t) {
  return [t === 1 ? 9 : t - 1, t === 9 ? 1 : t + 1];
}

function meilleureAile(pourcentages, t) {
  const [a, b] = ailes(t);
  return pourcentages[a] === pourcentages[b] ? null : pourcentages[a] > pourcentages[b] ? a : b;
}

function relies(questionnaire, a, b) {
  const d = questionnaire.fleches.desintegration;
  return d[a] === b || d[b] === a;
}

export const NOMS_CENTRES = { instinctif: 'Instinctif', emotionnel: 'Émotionnel', mental: 'Mental' };
