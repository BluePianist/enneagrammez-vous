// Calcul du type ennéagramme à partir des réponses au questionnaire.
// Reprise de /questionnaire/calcul.js (règle décrite dans questionnaire.json).
// reponses : objet { idQuestion: valeur 0..4 }. questionnaire : contenu de questionnaire.json.
// Si plusieurs types sont ex æquo, typePrincipal vaut null et questionDepartage contient
// la question à poser ; on appelle ensuite appliquerDepartage avec le type choisi.
export function calculerType(questionnaire, reponses) {
  const scores = {}, compulsion = {}, nbQuestions = {};
  for (let t = 1; t <= 9; t++) { scores[t] = 0; compulsion[t] = 0; nbQuestions[t] = 0; }

  for (const q of questionnaire.questions) {
    const v = reponses[q.id];
    if (!Number.isInteger(v) || v < 0 || v > 4) throw new Error(`Réponse manquante ou invalide pour la question ${q.id}`);
    scores[q.type] += v;
    nbQuestions[q.type]++;
    if (q.dimension === 'compulsion') compulsion[q.type] = v;
  }

  // Classement : score total, puis réponse à la question « compulsion » (ordre d'affichage seulement).
  const classement = Object.keys(scores).map(Number)
    .sort((a, b) => scores[b] - scores[a] || compulsion[b] - compulsion[a]);
  const exAequo = classement.filter(t => scores[t] === scores[classement[0]]);

  const pourcentages = {};
  for (const t in scores) pourcentages[t] = Math.round(scores[t] / (nbQuestions[t] * 4) * 100);

  const centres = { instinctif: [8, 9, 1], emotionnel: [2, 3, 4], mental: [5, 6, 7] };
  const scoresCentres = {};
  for (const [c, types] of Object.entries(centres)) scoresCentres[c] = types.reduce((s, t) => s + scores[t], 0);

  // Scores maximaux d'un type (3 questions × 4 = 12) et d'un centre (3 types), pour l'affichage.
  const maxType = Math.max(...Object.values(nbQuestions)) * 4;
  const resultat = { scores, pourcentages, classement, centres: scoresCentres, maxType, maxCentre: maxType * 3, exAequo: [] };

  if (exAequo.length > 1) {
    const d = questionnaire.departage;
    return {
      ...resultat,
      typePrincipal: null,
      exAequo,
      fiabilite: 'ex æquo',
      aile: null,
      questionDepartage: {
        question: d.questions[Math.floor(Math.random() * d.questions.length)],
        options: [...exAequo].sort((a, b) => a - b).map(t => ({ type: t, ...d.options[t] }))
      }
    };
  }

  const premier = classement[0];
  const ecart = scores[premier] - scores[classement[1]];
  return { ...resultat, ...typeEtAile(scores, premier), fiabilite: ecart >= 4 ? 'net' : 'à confirmer' };
}

// Termine le calcul après la question de départage : typeChoisi est le type de l'option retenue.
export function appliquerDepartage(resultat, typeChoisi) {
  if (!resultat.exAequo.includes(typeChoisi)) throw new Error(`Le type ${typeChoisi} ne fait pas partie des ex æquo`);
  const { questionDepartage, ...reste } = resultat;
  return { ...reste, ...typeEtAile(resultat.scores, typeChoisi), fiabilite: 'départagé' };
}

function typeEtAile(scores, type) {
  const voisins = [type === 1 ? 9 : type - 1, type === 9 ? 1 : type + 1];
  const aile = scores[voisins[0]] === scores[voisins[1]] ? null
    : scores[voisins[0]] > scores[voisins[1]] ? voisins[0] : voisins[1];
  return { typePrincipal: type, aile };
}

export const NOMS_CENTRES = { instinctif: 'Instinctif', emotionnel: 'Émotionnel', mental: 'Mental' };
