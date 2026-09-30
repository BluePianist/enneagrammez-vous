import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculerType, appliquerDepartage } from '../src/lib/calcul.js';
import { construireProfil } from '../src/lib/profil.js';

const questionnaire = JSON.parse(readFileSync(new URL('../src/data/questionnaire.json', import.meta.url)));
const repondre = (parType) => Object.fromEntries(questionnaire.questions.map(q => [q.id, parType(q)]));

test('type net avec aile', () => {
  const r = calculerType(questionnaire, repondre(q => (q.type === 4 ? 4 : q.type === 5 ? 2 : 0)));
  assert.equal(r.typePrincipal, 4);
  assert.equal(r.aile, 5);
  assert.equal(r.fiabilite, 'net');
  assert.equal(r.scores[4], 12);
  assert.equal(r.pourcentages[4], 100);
  assert.equal(r.maxType, 12);
  assert.equal(r.maxCentre, 36);
  assert.equal(construireProfil(questionnaire, r).nomAile, "L'Observateur");
});

test('égalité de scores : la réponse « compulsion » ne tranche plus, la personne départage', () => {
  const valeurs = { 1: { compulsion: 4, fierte: 2, situation: 3 }, 9: { compulsion: 2, fierte: 4, situation: 3 } };
  const r = calculerType(questionnaire, repondre(q => valeurs[q.type]?.[q.dimension] ?? 0));
  assert.equal(r.scores[1], r.scores[9]);
  assert.equal(r.typePrincipal, null);
  assert.deepEqual([...r.exAequo].sort(), [1, 9]);
});

test('ex æquo : question tirée dans la liste, options des seuls types ex æquo', () => {
  const r = calculerType(questionnaire, repondre(q => (q.type === 2 || q.type === 7 ? 3 : q.type === 8 ? 1 : 0)));
  assert.equal(r.typePrincipal, null);
  assert.equal(r.fiabilite, 'ex æquo');
  assert.deepEqual([...r.exAequo].sort(), [2, 7]);
  assert.ok(questionnaire.departage.questions.includes(r.questionDepartage.question));
  assert.deepEqual(r.questionDepartage.options.map(o => o.type), [2, 7]);
  assert.equal(r.questionDepartage.options[1].titre, 'La souffrance');
  assert.equal(construireProfil(questionnaire, r), null);
});

test('les deux questions de départage sont tirées au hasard', () => {
  const vues = new Set();
  for (let i = 0; i < 200; i++) {
    vues.add(calculerType(questionnaire, repondre(() => 2)).questionDepartage.question);
  }
  assert.equal(vues.size, questionnaire.departage.questions.length);
});

test('appliquerDepartage : le type choisi devient le type principal, avec son aile', () => {
  const r = calculerType(questionnaire, repondre(q => (q.type === 2 || q.type === 7 ? 3 : q.type === 8 ? 1 : 0)));
  const final = appliquerDepartage(r, 7);
  assert.equal(final.typePrincipal, 7);
  assert.equal(final.aile, 8);
  assert.equal(final.fiabilite, 'départagé');
  assert.equal(final.questionDepartage, undefined);
  const p = construireProfil(questionnaire, final);
  assert.equal(p.type, 7);
  assert.equal(p.nomAile, 'Le Protecteur');
  assert.equal(p.maxType, 12);
  assert.throws(() => appliquerDepartage(r, 4));
});

test('27 questions, 3 par type', () => {
  assert.equal(questionnaire.questions.length, 27);
  for (let t = 1; t <= 9; t++) assert.equal(questionnaire.questions.filter(q => q.type === t).length, 3);
});

test('3 points d\'écart restent à confirmer, 4 points sont nets', () => {
  const avec = (ecart) => calculerType(questionnaire, repondre(q => (q.type === 3 ? 4 : q.type === 6 ? (q.dimension === 'situation' ? 4 - ecart : 4) : 0)));
  assert.equal(avec(3).fiabilite, 'à confirmer');
  assert.equal(avec(4).fiabilite, 'net');
});

test('réponse manquante refusée', () => {
  assert.throws(() => calculerType(questionnaire, {}));
});

test('données de départage : une option par type, deux questions', () => {
  assert.equal(questionnaire.departage.questions.length, 2);
  for (let t = 1; t <= 9; t++) {
    assert.ok(questionnaire.departage.options[t].titre);
    assert.ok(questionnaire.departage.options[t].texte);
  }
  assert.equal(questionnaire.types[8].nom, 'Le Protecteur');
});
