import { useId } from 'react';

const CX = 200, CY = 200, R = 140, R_CHIFFRES = 168;

// Les 9 types sont espacés de 40° sur le cercle, le 9 en haut, dans le sens des aiguilles d'une montre.
const angle = (type) => ((-90 + (type % 9) * 40) * Math.PI) / 180;
const point = (a, r = R) => ({ x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) });

// Triangle 3-6-9 et hexagramme 1-4-2-8-5-7 : les lignes qui relient les types.
const LIENS = [[9, 3], [3, 6], [6, 9], [1, 4], [4, 2], [2, 8], [8, 5], [5, 7], [7, 1]];

// Angle du point de l'utilisateur : sur le type si l'aile est nulle, puis de plus en plus
// vers l'aile (jusqu'à mi-chemin) quand la part de l'aile augmente.
function angleDuPoint({ type, aile, poidsAile }) {
  if (!aile) return angle(type);
  const sens = aile === (type % 9) + 1 ? 1 : -1;
  return angle(type) + sens * poidsAile * ((40 * Math.PI) / 180);
}

// Intensité (0,14 à 1) d'un type selon sa distance angulaire au point : les lignes sont
// lumineuses près de lui et s'estompent vers les types éloignés.
function intensite(typeAngle, pointAngle) {
  const k = (1 + Math.cos(typeAngle - pointAngle)) / 2;
  return 0.14 + 0.86 * Math.pow(k, 1.5);
}

export default function SchemaEnneagramme({ profil }) {
  const id = useId().replace(/:/g, '');
  const a = angleDuPoint(profil);
  const p = point(a);
  const types = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const mis = new Set([profil.type, profil.aile].filter(Boolean));
  const description = profil.aile
    ? `Tu te situes entre le ${profil.type} et le ${profil.aile}, plus proche du ${profil.poidsAile < 0.5 ? profil.type : profil.aile}.`
    : `Tu te situes sur le ${profil.type}.`;

  return (
    <figure className="schema">
      <svg viewBox="0 0 400 400" className="schema-svg" role="img" aria-label={`Schéma de l'ennéagramme. ${description}`}>
        <defs>
          {LIENS.map(([de, vers]) => {
            const d = point(angle(de)), v = point(angle(vers));
            return (
              <linearGradient key={`${de}-${vers}`} id={`${id}-${de}-${vers}`} gradientUnits="userSpaceOnUse" x1={d.x} y1={d.y} x2={v.x} y2={v.y}>
                <stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: intensite(angle(de), a) }} />
                <stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: intensite(angle(vers), a) }} />
              </linearGradient>
            );
          })}
        </defs>

        <circle cx={CX} cy={CY} r={R} className="schema-cercle" />

        {LIENS.map(([de, vers]) => {
          const d = point(angle(de)), v = point(angle(vers));
          return <line key={`${de}-${vers}`} x1={d.x} y1={d.y} x2={v.x} y2={v.y} stroke={`url(#${id}-${de}-${vers})`} className="schema-lien" />;
        })}

        {types.map(t => {
          const s = point(angle(t)), c = point(angle(t), R_CHIFFRES);
          return (
            <g key={t}>
              <circle cx={s.x} cy={s.y} r="4" className="schema-noeud" style={{ opacity: intensite(angle(t), a) }} />
              <text x={c.x} y={c.y} className={`schema-chiffre${mis.has(t) ? ' actif' : ''}`} textAnchor="middle" dominantBaseline="central">{t}</text>
            </g>
          );
        })}

        <circle cx={p.x} cy={p.y} r="15" className="schema-halo" />
        <circle cx={p.x} cy={p.y} r="9" className="schema-point" />
      </svg>
      <figcaption className="schema-legende">
        <span className="schema-pastille" aria-hidden="true" />
        <span><strong>{profil.infos.nom}</strong> · {profil.type}{profil.aile ? `w${profil.aile}` : ''}</span>
      </figcaption>
    </figure>
  );
}
