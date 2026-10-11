import { jsPDF } from 'jspdf';
import { CREDITS } from './credits.js';

const PRUNE = [71, 39, 49];
const ROSE = [196, 122, 144];
const GRIS = [110, 110, 110];
const FOND = [240, 230, 234];

// Génère le récapitulatif dans le navigateur et lance le téléchargement.
export function genererPdf(profil, questionnaire, reponses) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marge = 18;
  const largeur = 210 - 2 * marge;
  let y = 22;

  const texte = (t, { taille = 11, gras = false, couleur = [30, 30, 30], espace = 1.5 } = {}) => {
    doc.setFont('helvetica', gras ? 'bold' : 'normal');
    doc.setFontSize(taille);
    doc.setTextColor(...couleur);
    const lignes = doc.splitTextToSize(t, largeur);
    doc.text(lignes, marge, y);
    y += lignes.length * taille * 0.42 + espace;
  };

  const barres = (lignes) => {
    for (const l of lignes) {
      doc.setFont('helvetica', l.actif ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(l.libelle, marge, y);
      const x = marge + 62, lb = largeur - 62 - 16;
      doc.setFillColor(...FOND);
      doc.roundedRect(x, y - 3.2, lb, 4, 1, 1, 'F');
      if (l.pourcentage > 0) {
        doc.setFillColor(...(l.actif ? PRUNE : ROSE));
        doc.roundedRect(x, y - 3.2, Math.max(2, lb * l.pourcentage / 100), 4, 1, 1, 'F');
      }
      doc.text(`${l.pourcentage} %`, marge + largeur, y, { align: 'right' });
      y += 7;
    }
  };

  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  texte('Enneagrammez-vous', { taille: 10, gras: true, couleur: ROSE, espace: 1 });
  texte(`Récapitulatif du profil, ${date}`, { taille: 10, couleur: GRIS, espace: 8 });

  const { type, aile, infos } = profil;
  texte(`Type ${type} : ${infos.nom}`, { taille: 22, gras: true, couleur: PRUNE, espace: 3 });
  texte(aile ? `Aile ${aile} : ${profil.nomAile} (${type}w${aile})` : 'Pas d\'aile dominante', { taille: 13, espace: 3 });
  texte(profil.texteFiabilite, { taille: 10, couleur: GRIS, espace: 6 });
  texte(infos['fierte-evitement'], { taille: 11, espace: 6 });

  for (const [libelle, valeur] of [
    ['Passion', infos.passion],
    ['Centre', profil.nomCentre]
  ]) {
    texte(libelle, { taille: 9, gras: true, couleur: GRIS, espace: 0.5 });
    texte(valeur, { taille: 11, espace: 3.5 });
  }
  if (profil.fiabilite !== 'net') texte(`Type le plus proche : ${profil.second}, ${profil.nomSecond}.`, { taille: 10, espace: 4 });

  y += 3;
  texte('Scores par type', { taille: 13, gras: true, couleur: PRUNE, espace: 4 });
  barres(profil.classement.map(l => ({ libelle: `${l.type}. ${l.nom}`, pourcentage: l.pourcentage, actif: l.type === type })));

  y += 3;
  texte('Centres (indicatif)', { taille: 13, gras: true, couleur: PRUNE, espace: 4 });
  barres(profil.centres.map(c => ({ libelle: c.nom, pourcentage: c.pourcentage })));

  y = 297 - 22;
  texte('Ce résultat est indicatif : seule une réflexion personnelle permet de confirmer son type.', { taille: 8, couleur: GRIS, espace: 0.5 });
  texte(CREDITS, { taille: 8, couleur: GRIS, espace: 0 });

  // Récapitulatif des réponses, dans l'ordre d'origine des questions.
  const libelles = Object.fromEntries(questionnaire.echelle.map(e => [e.valeur, e.libelle]));
  const largeurReponse = 28;
  const largeurQuestion = largeur - largeurReponse - 4;
  const nouvellePage = (titre) => {
    doc.addPage();
    y = 22;
    texte(titre, { taille: 13, gras: true, couleur: PRUNE, espace: 5 });
  };
  nouvellePage('Tes réponses');
  const questions = [...questionnaire.questions].sort((a, b) => a.id - b.id);
  questions.forEach((q, i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const lignes = doc.splitTextToSize(`${q.id}. ${q.texte}`, largeurQuestion);
    const hauteur = lignes.length * 4;
    if (y + hauteur > 297 - 16) {
      nouvellePage('Tes réponses (suite)');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
    }
    if (i % 2 === 0) {
      doc.setFillColor(...FOND);
      doc.rect(marge - 2, y - 3.6, largeur + 4, hauteur + 1.6, 'F');
    }
    doc.setTextColor(30, 30, 30);
    doc.text(lignes, marge, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRUNE);
    doc.text(libelles[reponses[q.id]] ?? '–', marge + largeur, y, { align: 'right' });
    y += hauteur + 1.6;
  });

  doc.save(`enneagramme-type-${type}.pdf`);
}
