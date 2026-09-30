import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculerType, appliquerDepartage } from '../src/lib/calcul.js';
import { construireProfil } from '../src/lib/profil.js';

const questionnaire = JSON.parse(readFileSync(new URL('../src/data/questionnaire.json', import.meta.url)));
const repondre = (f) => Object.fromEntries(questionnaire.questions.map(q => [q.id, f(q)]));
// Répond 4 aux questions des types listés, 0 ailleurs (questions de couple comprises).
const profil = (valeurs) => repondre(q => (q.dimension === 'amour' ? 0 : valeurs[q.type] ?? 0));

test('30 questions, 3 par type plus 3 de couple, avec des poids', () => {
  assert.equal(questionnaire.questions.length, 30);
  for (let t = 1; t <= 9; t++) {
    assert.equal(questionnaire.questions.filter(q => q.type === t && q.dimension !== 'amour').length, 3);
  }
  assert.equal(questionnaire.questions.filter(q => q.dimension === 'amour').length, 3);
  for (const q of questionnaire.questions) assert.ok(q.poids && Object.keys(q.poids).length > 0);
});

test('type net avec aile, pourcentages entre 0 et 100', () => {
  const r = calculerType(questionnaire, profil({ 8: 4, 7: 2 }));
  assert.equal(r.typePrincipal, 8);
  assert.equal(r.aile, 7);
  assert.equal(r.fiabilite, 'net');
  for (const p of Object.values(r.pourcentages)) assert.ok(p >= 0 && p <= 100);
  const p = construireProfil(questionnaire, r);
  assert.equal(p.nomAile, "L'Épicurien");
  assert.ok(p.poidsAile > 0 && p.poidsAile <= 0.5);
});

test('une réponse retire des points aux types qu\'elle contredit', () => {
  const q14 = questionnaire.questions.find(q => q.id === 14);
  assert.equal(q14.poids['1'], 2);
  assert.equal(q14.poids['8'], -0.5);
  const sans = calculerType(questionnaire, repondre(() => 0));
  const avec = calculerType(questionnaire, repondre(q => (q.id === 14 ? 4 : 0)));
  assert.ok(avec.scores[8] < sans.scores[8]);
  assert.equal(avec.scores[1], 8);
});

test('types proches : question de départage avec jusqu\'à 3 options', () => {
  const r = calculerType(questionnaire, profil({ 2: 4, 7: 4 }));
  assert.equal(r.typePrincipal, null);
  assert.equal(r.fiabilite, 'ex æquo');
  assert.ok(r.exAequo.includes(2) && r.exAequo.includes(7));
  assert.ok(r.exAequo.length <= 3);
  assert.ok(questionnaire.departage.questions.includes(r.questionDepartage.question));
  assert.deepEqual(r.questionDepartage.options.map(o => o.type), r.exAequo);
  assert.equal(construireProfil(questionnaire, r), null);
});

test('appliquerDepartage : le type choisi devient le type principal', () => {
  const r = calculerType(questionnaire, profil({ 2: 4, 7: 4 }));
  const final = appliquerDepartage(r, 7);
  assert.equal(final.typePrincipal, 7);
  assert.equal(final.fiabilite, 'départagé');
  assert.equal(final.questionDepartage, undefined);
  assert.equal(construireProfil(questionnaire, final).type, 7);
  assert.throws(() => appliquerDepartage(r, 5));
});

test('les deux questions de départage sont tirées au hasard', () => {
  const vues = new Set();
  for (let i = 0; i < 200; i++) vues.add(calculerType(questionnaire, repondre(() => 2)).questionDepartage.question);
  assert.equal(vues.size, 2);
});

test('réponse manquante refusée', () => {
  assert.throws(() => calculerType(questionnaire, {}));
});

test('données : une option de départage par type, 9 flèches', () => {
  for (let t = 1; t <= 9; t++) {
    assert.ok(questionnaire.departage.options[t].titre);
    assert.ok(questionnaire.types[t]['fierte-evitement']);
    assert.ok(questionnaire.fleches.desintegration[t]);
  }
});
