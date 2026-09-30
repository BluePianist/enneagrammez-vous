import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculerType } from '../src/lib/calcul.js';
import { construireProfil, eviteCourt } from '../src/lib/profil.js';

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
  assert.equal(construireProfil(questionnaire, r, null).nomAile, "L'Observateur");
});

test('égalité départagée par la compulsion', () => {
  const valeurs = { 1: { compulsion: 4, fierte: 2, situation: 3 }, 9: { compulsion: 2, fierte: 4, situation: 3 } };
  const r = calculerType(questionnaire, repondre(q => valeurs[q.type]?.[q.dimension] ?? 0));
  assert.equal(r.scores[1], r.scores[9]);
  assert.equal(r.typePrincipal, 1);
  assert.equal(r.fiabilite, 'à confirmer');
});

test('ex æquo : le choix de la personne décide du type et de l\'aile', () => {
  const r = calculerType(questionnaire, repondre(q => (q.type === 2 || q.type === 7 ? 3 : q.type === 8 ? 1 : 0)));
  assert.equal(r.typePrincipal, null);
  assert.deepEqual([...r.exAequo].sort(), [2, 7]);
  assert.equal(construireProfil(questionnaire, r, null), null);
  const p = construireProfil(questionnaire, r, 7);
  assert.equal(p.type, 7);
  assert.equal(p.aile, 8);
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

test('libellés courts pour le départage', () => {
  assert.equal(eviteCourt(questionnaire.types[1]), 'La colère');
  assert.equal(eviteCourt(questionnaire.types[2]), 'Reconnaître tes propres besoins');
  assert.equal(eviteCourt(questionnaire.types[6]), 'La déviance');
  for (const infos of Object.values(questionnaire.types)) assert.match(infos['fierte-evitement'], /éviter, c'est /);
  assert.equal(questionnaire.types[8].nom, 'Le Protecteur');
});
