import { jsPDF } from 'jspdf';
import { CREDITS } from './credits.js';

const PRUNE = [71, 39, 49];
const ROSE = [196, 122, 144];
const GRIS = [110, 110, 110];
const FOND = [240, 230, 234];

// Génère le récapitulatif dans le navigateur et lance le téléchargement.
export function genererPdf(profil) {
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

  const barres = (lignes, max) => {
    for (const l of lignes) {
      doc.setFont('helvetica', l.actif ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(l.libelle, marge, y);
      const x = marge + 62, lb = largeur - 62 - 16;
      doc.setFillColor(...FOND);
      doc.roundedRect(x, y - 3.2, lb, 4, 1, 1, 'F');
      if (l.score > 0) {
        doc.setFillColor(...(l.actif ? PRUNE : ROSE));
        doc.roundedRect(x, y - 3.2, Math.max(2, lb * l.score / max), 4, 1, 1, 'F');
      }
      doc.text(`${l.score}/${max}`, marge + largeur, y, { align: 'right' });
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
  barres(profil.classement.map(l => ({ libelle: `${l.type}. ${l.nom}`, score: l.score, actif: l.type === type })), profil.maxType);

  y += 3;
  texte('Centres (indicatif)', { taille: 13, gras: true, couleur: PRUNE, espace: 4 });
  barres(profil.centres.map(c => ({ libelle: c.nom, score: c.score })), profil.maxCentre);

  y = 297 - 22;
  texte('Ce résultat est indicatif : seule une réflexion personnelle permet de confirmer son type.', { taille: 8, couleur: GRIS, espace: 0.5 });
  texte(CREDITS, { taille: 8, couleur: GRIS, espace: 0 });

  doc.save(`enneagramme-type-${type}.pdf`);
}
