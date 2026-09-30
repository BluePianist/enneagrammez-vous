import { useMemo, useState } from 'react';
import questionnaire from './data/questionnaire.json';
import { calculerType } from './lib/calcul.js';
import { construireProfil } from './lib/profil.js';

const QUESTIONS = questionnaire.questions;

export default function App() {
  // Tout reste en mémoire dans l'onglet : rien n'est stocké ni envoyé.
  const [etape, setEtape] = useState('accueil');
  const [index, setIndex] = useState(0);
  const [reponses, setReponses] = useState({});
  const [typeChoisi, setTypeChoisi] = useState(null);

  const recommencer = () => {
    setReponses({});
    setIndex(0);
    setTypeChoisi(null);
    setEtape('accueil');
  };

  const repondre = (valeur) => {
    const q = QUESTIONS[index];
    setReponses(r => ({ ...r, [q.id]: valeur }));
    if (index < QUESTIONS.length - 1) setIndex(index + 1);
    else setEtape('resultats');
    window.scrollTo(0, 0);
  };

  return (
    <div className="page">
      <header className="entete">
        <button className="logo" onClick={recommencer} aria-label="Retour à l'accueil">
          Enneagrammez-vous
        </button>
      </header>
      <main className="contenu">
        {etape === 'accueil' && <Accueil onCommencer={() => setEtape('questions')} />}
        {etape === 'questions' && (
          <Question
            index={index}
            valeur={reponses[QUESTIONS[index].id]}
            onRepondre={repondre}
            onPrecedent={() => (index === 0 ? setEtape('accueil') : setIndex(index - 1))}
          />
        )}
        {etape === 'resultats' && (
          <Resultats
            reponses={reponses}
            typeChoisi={typeChoisi}
            onChoisirType={setTypeChoisi}
            onRecommencer={recommencer}
          />
        )}
      </main>
      <footer className="pied">
        Aucune donnée n'est enregistrée ni envoyée : vos réponses restent dans cet onglet et disparaissent quand vous le fermez.
      </footer>
    </div>
  );
}

function Accueil({ onCommencer }) {
  return (
    <section className="carte">
      <h1>Découvrez votre type ennéagramme</h1>
      <p>{QUESTIONS.length} affirmations, environ 5 minutes. À la fin, vous obtenez votre type principal, votre aile, et un récapitulatif à télécharger en PDF.</p>
      <p className="consigne">{questionnaire.consigne}</p>
      <button className="bouton principal" onClick={onCommencer}>Commencer le test</button>
      <p className="source">{questionnaire.source}</p>
    </section>
  );
}

function Question({ index, valeur, onRepondre, onPrecedent }) {
  const q = QUESTIONS[index];
  const progression = Math.round((index / QUESTIONS.length) * 100);
  return (
    <section className="carte">
      <div className="progression" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={QUESTIONS.length}>
        <div className="progression-barre" style={{ width: `${progression}%` }} />
      </div>
      <p className="compteur">Question {index + 1} sur {QUESTIONS.length}</p>
      <h2 className="affirmation">{q.texte}</h2>
      <div className="echelle">
        {questionnaire.echelle.map(e => (
          <button
            key={e.valeur}
            className={`choix${valeur === e.valeur ? ' choisi' : ''}`}
            onClick={() => onRepondre(e.valeur)}
          >
            {e.libelle}
          </button>
        ))}
      </div>
      <button className="bouton lien" onClick={onPrecedent}>← Précédent</button>
    </section>
  );
}

function Resultats({ reponses, typeChoisi, onChoisirType, onRecommencer }) {
  const resultat = useMemo(() => calculerType(questionnaire, reponses), [reponses]);
  const profil = useMemo(() => construireProfil(questionnaire, resultat, typeChoisi), [resultat, typeChoisi]);
  const [pdfEnCours, setPdfEnCours] = useState(false);

  const telecharger = async () => {
    setPdfEnCours(true);
    try {
      // Chargé à la demande pour garder l'app légère.
      const { genererPdf } = await import('./lib/pdf.js');
      genererPdf(profil);
    } finally {
      setPdfEnCours(false);
    }
  };

  if (!profil) {
    return (
      <section className="carte">
        <h1>Encore une question</h1>
        <p>Vos réponses placent plusieurs types à égalité. Pour les départager :</p>
        <h2 className="affirmation">Si vous ne pouviez éviter qu'une seule de ces choses, laquelle éviteriez-vous ?</h2>
        <div className="echelle">
          {resultat.exAequo.map(t => (
            <button key={t} className="choix" onClick={() => onChoisirType(t)}>
              {questionnaire.types[t].evite}
            </button>
          ))}
        </div>
      </section>
    );
  }

  const { type, aile, infos } = profil;
  return (
    <>
      <section className="carte resultat">
        <p className="surtitre">Votre type principal</p>
        <div className="type-badge">{type}</div>
        <h1>{infos.nom}</h1>
        {aile && <p className="aile">Aile {aile} : {profil.nomAile} <span className="notation">({type}w{aile})</span></p>}
        {!aile && <p className="aile">Pas d'aile dominante</p>}
        <p className={`fiabilite fiabilite-${profil.fiabilite === 'net' ? 'net' : 'doute'}`}>{profil.texteFiabilite}</p>
        <dl className="traits">
          <div><dt>Fierté</dt><dd>« {infos.fierte} »</dd></div>
          <div><dt>Ce que ce type évite</dt><dd>{infos.evite}</dd></div>
          <div><dt>Passion</dt><dd>{infos.passion}</dd></div>
          <div><dt>Centre</dt><dd>{profil.nomCentre}</dd></div>
        </dl>
        {profil.fiabilite !== 'net' && (
          <p className="note">Type le plus proche : {profil.second}, {profil.nomSecond}.</p>
        )}
      </section>

      <section className="carte">
        <h2>Scores par type</h2>
        <ul className="barres">
          {profil.classement.map(l => (
            <li key={l.type} className={l.type === type ? 'actif' : ''}>
              <span className="barre-libelle">{l.type}. {l.nom}</span>
              <span className="barre-fond"><span className="barre" style={{ width: `${l.pourcentage}%` }} /></span>
              <span className="barre-valeur">{l.score}/8</span>
            </li>
          ))}
        </ul>
        <h2>Centres</h2>
        <ul className="barres">
          {profil.centres.map(c => (
            <li key={c.nom}>
              <span className="barre-libelle">{c.nom}</span>
              <span className="barre-fond"><span className="barre" style={{ width: `${c.pourcentage}%` }} /></span>
              <span className="barre-valeur">{c.score}/24</span>
            </li>
          ))}
        </ul>
        <p className="note">Les centres sont donnés à titre indicatif.</p>
      </section>

      <div className="actions">
        <button className="bouton principal" onClick={telecharger} disabled={pdfEnCours}>
          {pdfEnCours ? 'Préparation…' : 'Télécharger le récapitulatif (PDF)'}
        </button>
        <button className="bouton secondaire" onClick={onRecommencer}>Refaire le test</button>
      </div>
    </>
  );
}
