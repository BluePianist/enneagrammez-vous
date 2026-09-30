// Calcul du type ennéagramme à partir des réponses au questionnaire.
// Reprise de /questionnaire/calcul.js (règle décrite dans questionnaire.json).
// reponses : objet { idQuestion: valeur 0..4 }. questionnaire : contenu de questionnaire.json.
export function calculerType(questionnaire, reponses) {
  const scores = {}, compulsion = {};
  for (let t = 1; t <= 9; t++) { scores[t] = 0; compulsion[t] = 0; }

  for (const q of questionnaire.questions) {
    const v = reponses[q.id];
    if (!Number.isInteger(v) || v < 0 || v > 4) throw new Error(`Réponse manquante ou invalide pour la question ${q.id}`);
    scores[q.type] += v;
    if (q.dimension === 'compulsion') compulsion[q.type] = v;
  }

  // Classement : score total, puis réponse à la question « compulsion ».
  const classement = Object.keys(scores).map(Number)
    .sort((a, b) => scores[b] - scores[a] || compulsion[b] - compulsion[a]);
  const premier = classement[0];
  const exAequo = classement.filter(t => scores[t] === scores[premier] && compulsion[t] === compulsion[premier]);

  const ecart = scores[premier] - scores[classement[1]];
  const fiabilite = exAequo.length > 1 ? 'ex æquo' : ecart >= 3 ? 'net' : 'à confirmer';

  const centres = { instinctif: [8, 9, 1], emotionnel: [2, 3, 4], mental: [5, 6, 7] };
  const scoresCentres = {};
  for (const [c, types] of Object.entries(centres)) scoresCentres[c] = types.reduce((s, t) => s + scores[t], 0);

  const pourcentages = {};
  for (const t in scores) pourcentages[t] = Math.round(scores[t] / 8 * 100);

  return {
    typePrincipal: exAequo.length > 1 ? null : premier,
    exAequo: exAequo.length > 1 ? exAequo : [],
    fiabilite,
    aile: exAequo.length > 1 ? null : calculerAile(scores, premier),
    scores,
    pourcentages,
    classement,
    centres: scoresCentres
  };
}

// Aile : parmi les deux voisins du type sur le cercle, celui au score le plus haut (null si égalité).
export function calculerAile(scores, type) {
  const voisins = [type === 1 ? 9 : type - 1, type === 9 ? 1 : type + 1];
  if (scores[voisins[0]] === scores[voisins[1]]) return null;
  return scores[voisins[0]] > scores[voisins[1]] ? voisins[0] : voisins[1];
}

export const NOMS_CENTRES = { instinctif: 'Instinctif', emotionnel: 'Émotionnel', mental: 'Mental' };
