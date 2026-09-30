import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculerType } from '../src/lib/calcul.js';
import { construireProfil } from '../src/lib/profil.js';

const questionnaire = JSON.parse(readFileSync(new URL('../src/data/questionnaire.json', import.meta.url)));
const repondre = (parType) => Object.fromEntries(questionnaire.questions.map(q => [q.id, parType(q)]));

test('type net avec aile', () => {
  const r = calculerType(questionnaire, repondre(q => (q.type === 4 ? 4 : q.type === 5 ? 2 : 0)));
  assert.equal(r.typePrincipal, 4);
  assert.equal(r.aile, 5);
  assert.equal(r.fiabilite, 'net');
  assert.equal(construireProfil(questionnaire, r, null).nomAile, "L'Observateur");
});

test('égalité départagée par la compulsion', () => {
  const r = calculerType(questionnaire, repondre(q => (q.type === 1 ? (q.dimension === 'compulsion' ? 4 : 2) : q.type === 9 ? (q.dimension === 'compulsion' ? 2 : 4) : 0)));
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

test('réponse manquante refusée', () => {
  assert.throws(() => calculerType(questionnaire, {}));
});
