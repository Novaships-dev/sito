// La page de MonSiteArtisan.com : ce qu'on fait, ce que ça rapporte, combien ça
// coûte, comment demander sa maquette. C'est aussi la porte de l'espace artisan
// (décision du 5 nov. 2026). Chargée à part : l'espace artisan n'en porte pas le poids.
//
// Version du 14 nov. 2026, demandée par Fabrice « du même niveau » que le site
// FG HORIZON : un univers 3D derrière la page (Univers.tsx), des panneaux de
// verre, des scènes qui restent à l'écran pendant le défilement, un simulateur
// de rentabilité, le numéro partout. Aucune photo n'apparaît deux fois.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import '@fontsource/instrument-serif/400-italic.css';
import './vitrine.css';
import { OFFRE, MENTION_TVA, WHATSAPP, TELEPHONE, TELEPHONE_LISIBLE, PHOTOS, lienWhatsApp, euros } from './offre';
import { Univers } from './Univers';

gsap.registerPlugin(ScrollTrigger);

// ------------------------------------------------------------------ petites pièces
function Photo({ src, alt, className = '', cadre }: { src: string | null; alt: string; className?: string; cadre?: string }) {
  const [echec, setEchec] = useState(false);
  const absente = !src || echec;
  return (
    <div className={`m-photo ${absente ? 'm-photo--absente' : ''} ${className}`}>
      {!absente && <img src={src} alt={alt} loading="lazy" decoding="async" style={cadre ? { objectPosition: cadre } : undefined} onError={() => setEchec(true)} />}
    </div>
  );
}

const Icone = ({ d, taille = 22 }: { d: string; taille?: number }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={taille} height={taille} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const I = {
  coche: 'M5 12.5l4.2 4.2L19 7',
  maison: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-9 9h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z',
  photo: 'M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  etoile: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  tel: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  loupe: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16l-4-4',
  eclair: 'M13 2L4 14h7l-1 8 9-12h-7z',
  fleche: 'M5 12h14m-6-6l6 6-6 6',
};

function Etoiles() {
  return <span className="m-etoiles" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <svg key={i} viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d={I.etoile} /></svg>)}</span>;
}

function LogoWhatsApp() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" /></svg>;
}

// Le symbole de MonSiteArtisan : un navigateur, un toit jaune, une fenêtre.
function Symbole({ taille = 34 }: { taille?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" width={taille} height={taille}>
      <rect width="100" height="100" rx="24" fill="#1d4a36" />
      <path d="M18 56 L50 28 L82 56" fill="none" stroke="#ffc53d" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M68 40 V24" stroke="#ffc53d" strokeWidth="10" />
      <g fill="#fff"><rect x="37" y="54" width="12" height="12" rx="2" /><rect x="51" y="54" width="12" height="12" rx="2" /><rect x="37" y="68" width="12" height="12" rx="2" /><rect x="51" y="68" width="12" height="12" rx="2" /></g>
    </svg>
  );
}

function BoutonMaquette({ texte = 'Recevoir ma maquette gratuite', variante = 'jaune', className = '' }: { texte?: string; variante?: 'jaune' | 'verre'; className?: string }) {
  return (
    <a className={`m-bouton m-bouton--${variante} m-aimant ${className}`} href={lienWhatsApp()} {...(WHATSAPP ? { target: '_blank', rel: 'noopener' } : {})}>
      <LogoWhatsApp />{texte}
    </a>
  );
}

function Etiquette({ children }: { children: ReactNode }) {
  return <p className="m-etiquette">{children}</p>;
}

// Un site d'artisan en miniature, dessiné en HTML : ce que l'artisan aura.
type Exemple = { nom: string; metier: string; ville: string; photo: string | null; cadre: string; style: CSSProperties; accroche: string };
const EXEMPLES: Exemple[] = [
  { nom: 'Toitures du Garlaban', metier: 'Couverture et zinguerie', ville: 'Marseille', photo: PHOTOS.couvreur, cadre: '28% 40%', accroche: 'Votre toit, tuile par tuile', style: { '--fond': '#0f1d2b', '--encre': '#f2f4f7', '--marque': '#e8a33c' } as CSSProperties },
  { nom: 'Atelier Blanc Lumière', metier: 'Peinture intérieure', ville: 'Aix-en-Provence', photo: PHOTOS.peintre, cadre: '50% 50%', accroche: 'Des pièces qui respirent', style: { '--fond': '#fbfaf7', '--encre': '#1d2b26', '--marque': '#3f7d6a' } as CSSProperties },
];

function MiniSite({ e, format }: { e: Exemple; format: 'ordinateur' | 'telephone' }) {
  return (
    <div className={`m-mini m-mini--${format}`} style={e.style}>
      <div className="m-mini-barre"><strong>{e.nom}</strong><span className="m-mini-appel">Appeler</span></div>
      <div className="m-mini-une">
        {format === 'ordinateur' ? <Photo src={e.photo} alt="" cadre={e.cadre} /> : <div className="m-mini-aplat" />}
        <div className="m-mini-texte">
          <span className="m-mini-metier">{e.metier} à {e.ville}</span>
          <span className="m-mini-titre">{e.accroche}</span>
          <span className="m-mini-cta">Appeler pour un devis</span>
        </div>
      </div>
      <div className="m-mini-bas"><span><Etoiles />Avis Google</span><span>Chantiers récents</span></div>
    </div>
  );
}

// Avant / après à glisser : ce que l'artisan verra sur son propre site.
function AvantApres() {
  const [pos, setPos] = useState(50);
  return (
    <div className="m-aa" style={{ '--pos': `${pos}%` } as CSSProperties}>
      <Photo src={PHOTOS.apres} alt="La même façade après ravalement" className="m-aa-apres" />
      <Photo src={PHOTOS.avant} alt="Une façade avant ravalement, sale et fissurée" className="m-aa-avant" />
      <span className="m-aa-etiquette m-aa-etiquette--avant">Avant</span>
      <span className="m-aa-etiquette m-aa-etiquette--apres">Après</span>
      <span className="m-aa-trait" aria-hidden="true"><span /></span>
      <input type="range" min="0" max="100" value={pos} onChange={(ev) => setPos(Number(ev.target.value))} aria-label="Glisser pour comparer avant et après" />
    </div>
  );
}

// Le simulateur : l'artisan met ses propres chiffres, la courbe monte.
function Simulateur() {
  const [chantier, setChantier] = useState(3000);
  const [nombre, setNombre] = useState(2);
  const cout = OFFRE.prixMois * 12;
  const gain = chantier * nombre;
  const fois = gain / cout;
  const rembourse = fois >= 1 ? `${fois >= 10 ? Math.round(fois) : fois.toFixed(1).replace('.', ',').replace(/,0$/, '')} fois` : `en ${Math.ceil(cout / (gain / 12))} mois`;
  // la courbe : le site met quelques mois à se faire connaître, puis rapporte chaque mois
  const pts: string[] = [], cts: string[] = [];
  const max = Math.max(gain, cout, 1);
  let cumul = 0;
  for (let i = 0; i < 12; i++) {
    cumul += (gain / 10.5) * Math.min(1, (i + 1) / 4);
    const x = (i / 11) * 320;
    pts.push(`${i ? 'L' : 'M'}${x.toFixed(1)} ${(110 - (cumul / max) * 100).toFixed(1)}`);
    cts.push(`${i ? 'L' : 'M'}${x.toFixed(1)} ${(110 - ((cout / 12) * (i + 1) / max) * 100).toFixed(1)}`);
  }
  const yFin = 110 - (cumul / max) * 100;
  return (
    <form className="m-simu m-verre" onSubmit={(e) => e.preventDefault()} aria-label="Simulateur de rentabilité">
      <div className="m-champ">
        <label htmlFor="m-r-chantier">Valeur moyenne d’un chantier <output htmlFor="m-r-chantier">{euros(chantier)}</output></label>
        <input id="m-r-chantier" type="range" min="500" max="30000" step="500" value={chantier} onChange={(e) => setChantier(Number(e.target.value))} />
      </div>
      <div className="m-champ">
        <label htmlFor="m-r-nombre">Chantiers en plus par an grâce au site <output htmlFor="m-r-nombre">{nombre}</output></label>
        <input id="m-r-nombre" type="range" min="1" max="24" step="1" value={nombre} onChange={(e) => setNombre(Number(e.target.value))} />
      </div>
      <div className="m-courbe" aria-hidden="true">
        <div className="m-courbe-tete"><span><i className="m-courbe-or" />Chiffre d’affaires gagné, cumulé</span><span><i className="m-courbe-gris" />Coût du site, cumulé</span></div>
        <svg viewBox="0 0 320 120">
          <defs><linearGradient id="m-g-jaune" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffc53d" stopOpacity=".5" /><stop offset="1" stopColor="#ffc53d" stopOpacity="0" /></linearGradient></defs>
          <line x1="0" y1="110" x2="320" y2="110" className="m-axe" /><line x1="0" y1="60" x2="320" y2="60" className="m-axe" /><line x1="0" y1="10" x2="320" y2="10" className="m-axe" />
          <path d={`${pts.join(' ')} L320 110 L0 110 Z`} fill="url(#m-g-jaune)" />
          <path d={pts.join(' ')} fill="none" stroke="#ffc53d" strokeWidth="2.5" strokeLinecap="round" />
          <path d={cts.join(' ')} fill="none" stroke="#8fa197" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="320" cy={yFin} r="4.5" fill="#fff5d6" stroke="#ffc53d" strokeWidth="2" />
          <text x="0" y="119">Mois 1</text><text x="320" y="119" textAnchor="end">Mois 12</text>
        </svg>
      </div>
      <div className="m-bilan">
        <div><small>Chiffre d’affaires en plus par an</small><strong className="m-or">{euros(gain)}</strong></div>
        <div><small>Votre site remboursé</small><strong>{rembourse}</strong></div>
      </div>
      <p className="m-discret">Simulation avec les chiffres que vous choisissez, pas une promesse de résultat.</p>
    </form>
  );
}

// ------------------------------------------------------------------ contenu
const INCLUS = [
  { i: I.maison, t: 'Un vrai site à votre nom', d: 'Fait pour votre métier et votre secteur, différent de celui du voisin.' },
  { i: I.globe, t: 'Votre nom de domaine', d: 'En .fr ou .com, acheté à votre nom. Il est à vous, même si vous partez.' },
  { i: I.photo, t: 'Vos chantiers en photos', d: 'Avant, après : vous les ajoutez depuis votre téléphone, le site se met à jour.' },
  { i: I.etoile, t: 'Vos avis Google affichés', d: 'Les clients voient ce que les autres pensent de votre travail.' },
  { i: I.tel, t: 'Des clients qui appellent', d: 'Un bouton pour vous appeler, toujours à portée du pouce.' },
  { i: I.loupe, t: 'Fait pour Google', d: 'Votre métier et votre ville, écrits pour que les clients du coin vous trouvent.' },
];

const GAINS = [
  { place: 'google', photo: PHOTOS.google, cadre: '50% 40%', alt: 'Un artisan tient son téléphone : son entreprise apparaît dans les résultats Google', t: 'Vous sortez sur Google', d: 'Votre nom, vos photos et vos avis, au moment où le client cherche.' },
  { place: 'appel', photo: PHOTOS.appel, cadre: '40% 50%', alt: 'Un téléphone sonne sur un établi, à côté d’un carnet de plans', t: 'Le téléphone sonne', d: 'Pendant que vous êtes sur le chantier, le site vous envoie des clients.' },
  { place: 'couvreur', photo: PHOTOS.couvreurPouce, cadre: '40% 30%', alt: 'Un couvreur lève le pouce sur un toit de tuiles au coucher du soleil', t: 'Les chantiers s’enchaînent', d: 'Un carnet de commandes rempli plus loin à l’avance.' },
  { place: 'equipe', photo: PHOTOS.equipe, cadre: '50% 30%', alt: 'Un peintre et son apprenti se serrent la main dans une pièce refaite', t: 'De quoi embaucher', d: 'Plus de demandes, c’est un apprenti ou un compagnon de plus.' },
  { place: 'cliente', photo: PHOTOS.clienteRavie, cadre: '30% 35%', alt: 'Une propriétaire souriante devant sa façade refaite', t: 'Des clients qui recommandent', d: 'Un beau chantier en photos, ça se montre et ça se partage.' },
];

const ETAPES = [
  { t: 'Votre maquette, offerte', d: 'On prépare votre site à votre nom. Vous le voyez sur votre téléphone avant de payer.', n: 'Gratuit' },
  { t: 'Vous choisissez', d: `Au mois avec ${OFFRE.moisOfferts} mois offert, ou à l’année. Rien de technique pour vous.`, n: 'Sans surprise' },
  { t: 'Votre site est en ligne', d: 'Avec votre nom de domaine, votre numéro, vos avis Google.', n: 'Domaine compris' },
  { t: 'Les appels arrivent', d: 'Vous ajoutez vos chantiers depuis l’app, le site travaille pour vous.', n: 'Suivi inclus' },
];

const QUESTIONS = [
  { q: 'Je ne suis pas à l’aise avec internet. C’est pour moi ?', r: 'Oui. On s’occupe de tout : les textes, la mise en ligne, le nom de domaine. Vous, vous envoyez des photos depuis votre téléphone, comme sur WhatsApp.' },
  { q: 'Je n’ai pas de belles photos de mes chantiers.', r: 'La maquette se fait avec des images d’exemple, marquées comme telles. Vous les remplacez par les vôtres au fil des chantiers.' },
  { q: 'Je m’engage pour combien de temps ?', r: `Au mois, ${OFFRE.engagementMois} mois, parce que le nom de domaine se paie à l’année. À l’année, vous payez ${euros(OFFRE.prixAn)}, renouvelé l’année suivante si vous le voulez.` },
  { q: 'Le nom de domaine est à qui ?', r: 'À vous. Il est acheté à votre nom au premier paiement. Si vous arrêtez, vous le gardez et vous pouvez l’emmener ailleurs.' },
  { q: 'Qui écrit les textes ?', r: 'Nous. Ils parlent de votre métier, de votre secteur et de vos chantiers. Vous les relisez sur la maquette.' },
  { q: 'Et si la maquette ne me plaît pas ?', r: 'Vous ne payez rien. Vous dites ce qu’il faut changer, ou vous en restez là.' },
];

// ------------------------------------------------------------------ la page
export function Vitrine() {
  const economie = OFFRE.prixMois * 12 - OFFRE.prixAn;
  const racine = useRef<HTMLDivElement>(null);
  // Le bouton flottant n'apparaît qu'une fois le bouton du haut sorti de l'écran.
  const haut = useRef<HTMLDivElement>(null);
  const [flottant, setFlottant] = useState(false);
  const [entetePleine, setEntetePleine] = useState(false);
  useEffect(() => {
    const el = haut.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const o = new IntersectionObserver(([e]) => setFlottant(!e.isIntersecting && e.boundingClientRect.top < 0));
    o.observe(el);
    const surDefil = () => setEntetePleine(window.scrollY > 30);
    window.addEventListener('scroll', surDefil, { passive: true });
    return () => { o.disconnect(); window.removeEventListener('scroll', surDefil); };
  }, []);

  // La chorégraphie : défilement doux, scènes épinglées, apparitions, détails au pointeur.
  useEffect(() => {
    const el = racine.current;
    if (!el) return;
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduit) el.classList.add('m-anime');
    let lenis: Lenis | null = null;
    const tic = (t: number) => lenis?.raf(t * 1000);
    if (!reduit) {
      lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tic);
      gsap.ticker.lagSmoothing(0);
    }
    const nettoyages: Array<() => void> = [];
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ ok: '(prefers-reduced-motion: no-preference)', large: '(min-width: 981px)' }, (c) => {
        const { ok, large } = c.conditions as { ok: boolean; large: boolean };
        if (!ok) return;
        gsap.from('.m-h1 .m-ligne > span', { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.08, delay: 0.1 });
        gsap.from(['.m-une-chapeau', '.m-une-preuves li', '.m-carte-flottante'], { opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.5 });
        gsap.to('.m-une-texte', { opacity: 0, y: -60, ease: 'none', scrollTrigger: { trigger: '.m-une', start: '35% top', end: 'bottom top', scrub: true } });

        // la recherche Google : la frappe et le résultat qui monte
        if (large) {
          const req = 'façadier Aubagne';
          const champ = el.querySelector<HTMLElement>('.m-moteur-requete');
          const tl = gsap.timeline({ scrollTrigger: { trigger: '.m-recherche', start: 'top top', end: 'bottom bottom', scrub: 1,
            onUpdate: (s) => { if (champ) champ.textContent = req.slice(0, Math.round(Math.min(1, s.progress / 0.3) * req.length)) || ' '; } } });
          tl.fromTo('.m-resultat--gris', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.15 }, 0.3)
            .fromTo('.m-resultat--vous', { opacity: 0, y: 220, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' }, 0.45)
            .fromTo('.m-recherche-texte p', { opacity: 0.25 }, { opacity: 1, stagger: 0.1, duration: 0.2 }, 0.5);

          // les exemples : les appareils tournent, l'écran change de site
          const tl2 = gsap.timeline({ scrollTrigger: { trigger: '.m-exemples', start: 'top top', end: 'bottom bottom', scrub: 1.2 } });
          tl2.fromTo('.m-ordi', { rotateY: -30, rotateX: 16, z: -240, y: 70 }, { rotateY: 10, rotateX: 4, z: 0, y: 0, duration: 0.4 }, 0)
            .fromTo('.m-tel', { rotateY: 40, z: -200, x: 120, y: 120 }, { rotateY: -16, z: 120, x: 0, y: 0, duration: 0.4 }, 0)
            .to('.m-ecran-1', { opacity: 0, duration: 0.1 }, 0.55)
            .fromTo('.m-ecran-2', { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.55)
            .fromTo('.m-exemple-nom-2', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.1 }, 0.58)
            .to('.m-exemple-nom-1', { opacity: 0, y: -20, duration: 0.1 }, 0.55)
            .to('.m-ordi', { rotateY: -8, duration: 0.4 }, 0.6)
            .to('.m-tel', { rotateY: -4, y: -30, duration: 0.4 }, 0.6);

          // les étapes : défilement horizontal
          const piste = el.querySelector<HTMLElement>('.m-piste');
          if (piste) {
            gsap.to(piste, { x: () => -(piste.scrollWidth - window.innerWidth), ease: 'none',
              scrollTrigger: { trigger: '.m-piste-cadre', start: 'center center', end: () => `+=${piste.scrollWidth - window.innerWidth}`, pin: true, scrub: 1, invalidateOnRefresh: true } });
          }
        }

        // la grande photo qui s'ouvre
        gsap.fromTo('.m-promesse-cadre', { clipPath: 'inset(8% 10% 8% 10% round 32px)' }, { clipPath: 'inset(0% 0% 0% 0% round 32px)', ease: 'none', scrollTrigger: { trigger: '.m-promesse-cadre', start: 'top 90%', end: 'top 25%', scrub: true } });
        gsap.fromTo('.m-promesse-cadre img', { yPercent: -8, scale: 1.12 }, { yPercent: 4, scale: 1, ease: 'none', scrollTrigger: { trigger: '.m-promesse-cadre', start: 'top bottom', end: 'bottom top', scrub: true } });
        gsap.from('.m-sonnerie', { scale: 0.6, opacity: 0, duration: 1, ease: 'back.out(2.2)', scrollTrigger: { trigger: '.m-promesse-cadre', start: 'top 50%' } });

        gsap.utils.toArray<HTMLElement>('.m-gain').forEach((g, i) => {
          gsap.fromTo(g, { clipPath: 'inset(18% 12% 18% 12% round 28px)', opacity: 0 }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', opacity: 1, duration: 1.3, ease: 'expo.out', delay: (i % 3) * 0.08, scrollTrigger: { trigger: g, start: 'top 90%' } });
          const img = g.querySelector('img');
          if (img) gsap.fromTo(img, { scale: 1.18, yPercent: -6 }, { scale: 1.02, yPercent: 6, ease: 'none', scrollTrigger: { trigger: g, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
        gsap.fromTo('.m-recherche-photo img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.m-recherche', start: 'top bottom', end: 'bottom top', scrub: true } });

        gsap.utils.toArray<HTMLElement>('.m-monte').forEach((x) => {
          gsap.fromTo(x, { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: x, start: 'top 88%' } });
        });
        gsap.from('.m-numero', { scale: 0.8, opacity: 0, filter: 'blur(12px)', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.m-fin', start: 'top 70%' } });
      });

      // au pointeur, sur ordinateur
      const fin = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (fin && !reduit) {
        el.querySelectorAll<HTMLElement>('.m-aimant').forEach((b) => {
          const bouge = (e: PointerEvent) => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: 'power3.out' }); };
          const sort = () => gsap.to(b, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
          b.addEventListener('pointermove', bouge); b.addEventListener('pointerleave', sort);
          nettoyages.push(() => { b.removeEventListener('pointermove', bouge); b.removeEventListener('pointerleave', sort); });
        });
        el.querySelectorAll<HTMLElement>('.m-incline').forEach((t) => {
          const bouge = (e: PointerEvent) => { const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
            t.style.setProperty('--mx', `${x * 100}%`); t.style.setProperty('--my', `${y * 100}%`);
            gsap.to(t, { rotateY: (x - 0.5) * 9, rotateX: (0.5 - y) * 9, transformPerspective: 1100, duration: 0.6, ease: 'power3.out' }); };
          const sort = () => gsap.to(t, { rotateX: 0, rotateY: 0, duration: 1, ease: 'power3.out' });
          t.addEventListener('pointermove', bouge); t.addEventListener('pointerleave', sort);
          nettoyages.push(() => { t.removeEventListener('pointermove', bouge); t.removeEventListener('pointerleave', sort); });
        });
      }
    }, el);
    // Les photos chargées tard et les polices changent la hauteur de la page :
    // on recalcule alors les scènes épinglées, sinon elles se décalent.
    let attente = 0;
    const recalcule = () => { clearTimeout(attente); attente = window.setTimeout(() => ScrollTrigger.refresh(), 150); };
    const ro = 'ResizeObserver' in window ? new ResizeObserver(recalcule) : null;
    ro?.observe(el);
    document.fonts?.ready.then(recalcule);
    window.addEventListener('load', recalcule);
    return () => {
      ro?.disconnect();
      clearTimeout(attente);
      window.removeEventListener('load', recalcule);
      nettoyages.forEach((f) => f());
      ctx.revert();
      gsap.ticker.remove(tic);
      lenis?.destroy();
      el.classList.remove('m-anime');
    };
  }, []);

  return (
    <div className="m" ref={racine}>
      <div className="m-fond" aria-hidden="true" />
      <Univers />
      <a className="m-aller" href="#m-contenu">Aller au contenu</a>
      <header className={`m-entete ${entetePleine ? 'm-entete--pleine m-verre' : ''}`}>
        <a className="m-logo" href="#/" aria-label="MonSiteArtisan.com, accueil">
          <Symbole />
          <span className="m-logo-nom">MonSiteArtisan<span>.com</span></span>
        </a>
        <nav aria-label="Navigation de la page">
          <a href="#exemples">Exemples</a>
          <a href="#inclus">Compris</a>
          <a href="#rentabilite">Rentabilité</a>
          <a href="#prix">Prix</a>
        </nav>
        <a className="m-espace" href="#/connexion">Espace artisan</a>
      </header>

      <main id="m-contenu" tabIndex={-1}>
        {/* ---------------------------------------------------- ouverture : la maison 3D se construit derrière */}
        <section className="m-une" aria-labelledby="m-titre">
          <div className="m-une-texte">
            <Etiquette>Sites internet pour artisans du bâtiment</Etiquette>
            <h1 id="m-titre" className="m-h1">
              <span className="m-ligne"><span>Vos clients vous cherchent</span></span>{' '}
              <span className="m-ligne"><span>sur internet<span className="m-pt">.</span></span></span>{' '}
              <span className="m-ligne"><span><em>Soyez là<span className="m-pt">.</span></em></span></span>
            </h1>
            <p className="m-une-chapeau">Un site pro à votre nom, avec vos chantiers en photos, fait pour que les clients du coin vous appellent. Vous voyez la maquette avant de payer.</p>
            <div className="m-une-actions" ref={haut}>
              <BoutonMaquette />
              <a className="m-bouton m-bouton--verre m-aimant" href="#prix">Voir les prix</a>
            </div>
            <ul className="m-une-preuves">
              <li className="m-verre"><strong>{euros(OFFRE.prixMois)}</strong> par mois, tout compris</li>
              <li className="m-verre"><strong>0 €</strong> pour voir votre maquette</li>
              <li className="m-verre"><strong>.fr</strong> nom de domaine à vous</li>
            </ul>
          </div>
          <div className="m-une-cartes" aria-hidden="true">
            <div className="m-carte-flottante m-verre m-cf1"><span className="m-cf-icone"><Icone d={I.tel} taille={16} /></span><span><strong>Nouvel appel</strong>depuis votre site</span></div>
            <div className="m-carte-flottante m-verre m-cf2"><span className="m-cf-icone"><Icone d={I.etoile} taille={16} /></span><span><strong>Avis Google</strong>affichés sur le site</span></div>
            <div className="m-carte-flottante m-verre m-cf3"><span className="m-cf-icone"><Icone d={I.loupe} taille={16} /></span><span><strong>« façadier près de chez moi »</strong>vous apparaissez</span></div>
          </div>
        </section>

        {/* ---------------------------------------------------- la recherche Google, en direct */}
        <section className="m-recherche" aria-labelledby="m-t-recherche">
          <div className="m-recherche-scene">
            <div className="m-recherche-texte">
              <Etiquette>Ce que voit votre futur client</Etiquette>
              <h2 id="m-t-recherche">Un client cherche un façadier<span className="m-pt">.</span> <em>Il tombe sur vous<span className="m-pt">.</span></em></h2>
              <p>Avant d’appeler un artisan, un client regarde sur internet. Il compare les photos, les avis, et il appelle celui qui lui inspire confiance.</p>
              <p>Votre site est écrit avec votre métier et votre ville, pour que ce client-là trouve votre numéro.</p>
            </div>
            <div className="m-recherche-visuel">
            <Photo src={PHOTOS.cliente} alt="Une propriétaire cherche un artisan sur son téléphone, devant sa façade fissurée" className="m-recherche-photo" cadre="30% 40%" />
            <div className="m-moteur m-verre" aria-hidden="true">
              <div className="m-moteur-barre"><Icone d={I.loupe} taille={18} /><span className="m-moteur-requete">façadier Aubagne</span><i className="m-curseur-texte" /></div>
              <div className="m-resultat m-resultat--vous">
                <span className="m-resultat-adresse">www.votre-entreprise.fr</span>
                <span className="m-resultat-titre">Votre entreprise : ravalement de façade à Aubagne</span>
                <span className="m-resultat-note"><Etoiles />Avis Google</span>
                <span className="m-resultat-texte">Façades refaites, enduits, peinture extérieure. Devis gratuit, chantiers en photos.</span>
                <span className="m-resultat-actions"><span className="m-resultat-appel"><Icone d={I.tel} taille={14} />Appeler</span><span>Voir les chantiers</span></span>
              </div>
              <div className="m-resultat m-resultat--gris"><i /><i /><i /></div>
              <div className="m-resultat m-resultat--gris"><i /><i /><i /></div>
            </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- la promesse */}
        <section className="m-section m-promesse" aria-labelledby="m-t-promesse">
          <div className="m-promesse-cadre">
            <Photo src={PHOTOS.facadier} alt="Un façadier regarde son téléphone devant la façade qu’il vient de refaire" className="m-promesse-photo" cadre="30% 22%" />
            <div className="m-sonnerie m-verre" aria-hidden="true"><i><Icone d={I.tel} taille={18} /></i><span><strong>Nouvelle demande de devis</strong>trouvée grâce à votre site</span></div>
            <div className="m-promesse-texte m-verre">
              <Etiquette>La promesse</Etiquette>
              <h2 id="m-t-promesse">Vous êtes sur le chantier<span className="m-pt">.</span> <em>Votre site, lui, prospecte<span className="m-pt">.</span></em></h2>
              <p>Jour et nuit, il montre votre travail aux gens qui cherchent un artisan près de chez eux, et leur donne envie de vous appeler.</p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- les exemples, en 3D */}
        <section id="exemples" className="m-exemples" aria-labelledby="m-t-exemples">
          <div className="m-exemples-scene">
            <div className="m-exemples-texte">
              <Etiquette>Exemples</Etiquette>
              <h2 id="m-t-exemples">Un site différent <em>pour chaque artisan<span className="m-pt">.</span></em></h2>
              <p>Couleurs, mise en page, textes : chaque site est fait pour une entreprise et ne ressemble pas à celui du concurrent.</p>
              <div className="m-exemple-noms">
                <p className="m-exemple-nom m-exemple-nom-1 m-verre"><strong>Couvreur</strong> à Marseille</p>
                <p className="m-exemple-nom m-exemple-nom-2 m-verre"><strong>Peintre</strong> à Aix-en-Provence</p>
              </div>
            </div>
            <div className="m-appareils" aria-hidden="true">
              <div className="m-ordi">
                <div className="m-ordi-ecran"><div className="m-ordi-points"><i /><i /><i /></div>
                  <div className="m-ecrans"><div className="m-ecran-1"><MiniSite e={EXEMPLES[0]} format="ordinateur" /></div><div className="m-ecran-2"><MiniSite e={EXEMPLES[1]} format="ordinateur" /></div></div>
                </div>
                <div className="m-ordi-pied" />
              </div>
              <div className="m-tel">
                <div className="m-tel-ecran">
                  <div className="m-ecrans"><div className="m-ecran-1"><MiniSite e={EXEMPLES[0]} format="telephone" /></div><div className="m-ecran-2"><MiniSite e={EXEMPLES[1]} format="telephone" /></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- avant / après */}
        <section className="m-section m-chantiers" aria-labelledby="m-t-chantiers">
          <div className="m-chantiers-texte m-monte">
            <Etiquette>Vos chantiers</Etiquette>
            <h2 id="m-t-chantiers">Vos chantiers <em>parlent pour vous<span className="m-pt">.</span></em></h2>
            <p>Un client hésite entre trois artisans. Il choisit celui dont il voit le travail. Sur votre site, chaque chantier apparaît en avant et après, comme ici : glissez pour voir.</p>
            <p className="m-discret">Les photos partent de votre téléphone. Vous n’avez rien d’autre à faire.</p>
          </div>
          <div className="m-monte"><AvantApres /></div>
        </section>

        {/* ---------------------------------------------------- ce qui est compris */}
        <section id="inclus" className="m-section" aria-labelledby="m-t-inclus">
          <div className="m-titre-section m-monte">
            <Etiquette>Tout est compris</Etiquette>
            <h2 id="m-t-inclus">Vous faites le métier<span className="m-pt">.</span> <em>On fait le reste<span className="m-pt">.</span></em></h2>
            <p>Une seule formule, le site complet. Pas de frais de création, pas d’options cachées.</p>
          </div>
          <ul className="m-tuiles">
            {INCLUS.map((x) => (
              <li key={x.t} className="m-tuile m-verre m-incline m-monte">
                <span className="m-lueur" aria-hidden="true" />
                <span className="m-tuile-icone"><Icone d={x.i} /></span>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------- rentabilité */}
        <section id="rentabilite" className="m-section m-renta" aria-labelledby="m-t-renta">
          <div className="m-renta-texte m-monte">
            <Etiquette>Rentabilité</Etiquette>
            <h2 id="m-t-renta">Un seul chantier <em>paie des années de site<span className="m-pt">.</span></em></h2>
            <p>Votre site coûte {euros(OFFRE.prixMois * 12)} par an. Le prochain ravalement, la prochaine toiture ou la prochaine salle de bain trouvés grâce à lui valent souvent bien plus. Faites le calcul avec vos propres chiffres.</p>
            <BoutonMaquette texte="Je veux plus de clients" />
          </div>
          <div className="m-monte"><Simulateur /></div>
        </section>


        {/* ---------------------------------------------------- ce que ça change */}
        <section id="gains" className="m-section m-gains" aria-labelledby="m-t-gains">
          <div className="m-titre-section m-monte">
            <Etiquette>Ce que ça change</Etiquette>
            <h2 id="m-t-gains">Plus de clients<span className="m-pt">.</span> <em>Plus de chantiers<span className="m-pt">.</span></em></h2>
            <p>Un site qui travaille pour vous, c’est du chiffre d’affaires en plus, mois après mois.</p>
          </div>
          <ul className="m-mosaique">
            {GAINS.map((g) => (
              <li key={g.t} className={`m-gain m-gain--${g.place}`}>
                <Photo src={g.photo} alt={g.alt} cadre={g.cadre} />
                <div className="m-gain-texte m-verre"><h3>{g.t}</h3><p>{g.d}</p></div>
              </li>
            ))}
          </ul>
          <p className="m-discret m-gains-note">Photos d’illustration.</p>
        </section>

        {/* ---------------------------------------------------- l'app */}
        <section className="m-section m-app" aria-labelledby="m-t-app">
          <div className="m-app-visuel m-monte">
            <Photo src={PHOTOS.telephone} alt="Un artisan prend en photo une façade qu’il vient de finir" className="m-app-photo" />
          </div>
          <div className="m-app-texte m-monte">
            <Etiquette>L’app de l’artisan</Etiquette>
            <h2 id="m-t-app">Votre site se met à jour <em>depuis votre téléphone<span className="m-pt">.</span></em></h2>
            <ol className="m-gestes">
              <li className="m-verre"><strong>Ouvrez le chantier</strong><span>dans l’app, sur l’écran d’accueil de votre téléphone</span></li>
              <li className="m-verre"><strong>Photo avant, photo après</strong><span>comme une photo normale</span></li>
              <li className="m-verre"><strong>C’est publié</strong><span>le chantier apparaît sur votre site</span></li>
            </ol>
            <p className="m-discret">Pas de store, pas de mot de passe à inventer : votre identifiant vous est donné quand votre site est en ligne.</p>
            <div className="m-une-actions">
              <a className="m-bouton m-bouton--verre" href="#/connexion">Espace artisan</a>
              <a className="m-bouton m-bouton--verre" href="#/installer">Installer l’app</a>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- étapes, en défilement horizontal */}
        <section className="m-section m-etapes" aria-labelledby="m-t-etapes">
          <div className="m-titre-section m-monte">
            <Etiquette>Comment ça se passe</Etiquette>
            <h2 id="m-t-etapes">En ligne <em>en quelques jours<span className="m-pt">.</span></em></h2>
          </div>
          <div className="m-piste-cadre">
            <ol className="m-piste">
              {ETAPES.map((e, i) => <li key={e.t} className="m-etape m-verre"><span className="m-etape-n">0{i + 1}</span><h3>{e.t}</h3><p>{e.d}</p><span className="m-etape-note">{e.n}</span></li>)}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------------- prix */}
        <section id="prix" className="m-section m-prix" aria-labelledby="m-t-prix">
          <div className="m-titre-section m-monte">
            <Etiquette>Prix clairs</Etiquette>
            <h2 id="m-t-prix">Un prix<span className="m-pt">.</span> <em>Tout compris<span className="m-pt">.</span></em></h2>
            <p>Le même site complet. Vous choisissez seulement comment payer.</p>
          </div>
          <div className="m-cartes">
            <article className="m-carte m-verre m-incline m-monte" aria-labelledby="m-c-mois">
              <span className="m-lueur" aria-hidden="true" />
              <h3 id="m-c-mois">Au mois</h3>
              <p className="m-carte-prix"><strong>{euros(OFFRE.prixMois)}</strong><span>par mois</span></p>
              <p className="m-carte-offert">{OFFRE.moisOfferts} mois offert pour commencer</p>
              <ul>{['Site complet à votre nom', 'Nom de domaine .fr ou .com', 'Hébergement et mises à jour', 'Vos photos depuis le téléphone', 'Avis Google sur le site'].map((l) => <li key={l}><Icone d={I.coche} taille={18} />{l}</li>)}</ul>
              <p className="m-carte-note">Engagement {OFFRE.engagementMois} mois</p>
              <BoutonMaquette variante="verre" />
            </article>
            <article className="m-carte m-carte--an m-verre m-incline m-monte" aria-labelledby="m-c-an">
              <span className="m-lueur" aria-hidden="true" />
              <p className="m-carte-badge">{euros(economie)} d’économie</p>
              <h3 id="m-c-an">À l’année</h3>
              <p className="m-carte-prix"><strong>{euros(OFFRE.prixAn)}</strong><span>par an</span></p>
              <p className="m-carte-offert">Soit {euros(OFFRE.prixAn / 12)} par mois</p>
              <ul>{['Tout ce qui est compris au mois', 'Payé une fois par an', 'Renouvelé si vous le voulez'].map((l) => <li key={l}><Icone d={I.coche} taille={18} />{l}</li>)}</ul>
              <p className="m-carte-note">Sans mois offert</p>
              <BoutonMaquette />
            </article>
          </div>
          <aside className="m-vitrines m-verre m-monte" aria-labelledby="m-t-vitrines">
            <Photo src={PHOTOS.tablette} alt="Un façadier regarde son site sur une tablette, assis à l’arrière de son camion" className="m-vitrines-photo" cadre="35% 40%" />
            <div className="m-vitrines-texte">
              <h3 id="m-t-vitrines">{OFFRE.placesVitrine} artisans vitrines : {OFFRE.moisOffertsVitrine} mois offerts</h3>
              <p>Nos {OFFRE.placesVitrine} premiers sites servent d’exemple aux artisans qui viendront après. En échange, {OFFRE.moisOffertsVitrine} mois offerts, puis {euros(OFFRE.prixMois)} par mois.</p>
            </div>
            <BoutonMaquette texte="Être artisan vitrine" />
          </aside>
          <p className="m-tva">{MENTION_TVA}. Vous gardez votre nom de domaine si vous partez.</p>
        </section>

        {/* ---------------------------------------------------- questions */}
        <section id="questions" className="m-section m-questions" aria-labelledby="m-t-questions">
          <div className="m-titre-section m-monte"><Etiquette>Questions</Etiquette><h2 id="m-t-questions">Vos questions</h2></div>
          <div className="m-faq">
            {QUESTIONS.map((x) => <details key={x.q} className="m-verre"><summary>{x.q}</summary><p>{x.r}</p></details>)}
          </div>
        </section>

        {/* ---------------------------------------------------- fin */}
        <section id="contact" className="m-fin" aria-labelledby="m-t-fin">
          <Etiquette>Parlons de votre site</Etiquette>
          <h2 id="m-t-fin">Voyez votre site <em>avant de payer<span className="m-pt">.</span></em></h2>
          <p>Envoyez-nous le nom de votre entreprise sur WhatsApp, ou appelez : on vous prépare la maquette de votre site.</p>
          {TELEPHONE && <a className="m-numero" href={`tel:${TELEPHONE}`}>{TELEPHONE_LISIBLE}</a>}
          <div className="m-une-actions m-fin-actions">
            {WHATSAPP ? <BoutonMaquette /> : <p className="m-bientot">Le numéro WhatsApp arrive très bientôt sur cette page.</p>}
            {TELEPHONE && <a className="m-bouton m-bouton--verre m-aimant" href={`tel:${TELEPHONE}`}><Icone d={I.tel} taille={18} />Appeler</a>}
          </div>
        </section>
      </main>

      <footer className="m-pied">
        <span className="m-logo"><Symbole taille={26} /><span className="m-logo-nom">MonSiteArtisan<span>.com</span></span></span>
        <a href="#/connexion">Espace artisan</a>
        <a href="#/installer">Installer l’app</a>
        <span className="m-pied-droit">MonSiteArtisan est un service FG HORIZON. © 2026</span>
      </footer>

      <BoutonMaquette texte="Ma maquette gratuite" className={`m-flottant ${flottant ? 'm-flottant--vu' : ''}`} />
    </div>
  );
}

export default Vitrine;
