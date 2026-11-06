// La page de MonSiteArtisan.com : ce qu'on fait, combien ça coûte, comment
// demander sa maquette. C'est aussi la porte de l'espace artisan (décision du
// 5 nov. 2026). Chargée à part : l'espace artisan n'en porte pas le poids.
//
// Version du 6 nov. 2026, refaite après l'avis de Fabrice (« amplia est 100
// fois mieux niveau design ») : page claire et aérée, portée par des photos
// (docs/vitrine-images.md), des sites d'exemple montrés dans un ordinateur et
// un téléphone, un avant / après à glisser, les prix en deux cartes.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import './vitrine.css';
import { OFFRE, MENTION_TVA, WHATSAPP, PHOTOS, lienWhatsApp, euros } from './offre';

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
  cle: 'M15 7a4 4 0 1 0-3.9 4.9L4 19v2h3v-2h2v-2h2l1.1-1.1A4 4 0 0 0 15 7z',
  oeil: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
};

function Etoiles() {
  return <span className="m-etoiles" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <svg key={i} viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d={I.etoile} /></svg>)}</span>;
}

function LogoWhatsApp() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" /></svg>;
}

function BoutonMaquette({ texte = 'Recevoir ma maquette gratuite', variante = 'jaune', className = '' }: { texte?: string; variante?: 'jaune' | 'blanc' | 'noir'; className?: string }) {
  return (
    <a className={`m-bouton m-bouton--${variante} ${className}`} href={lienWhatsApp()} {...(WHATSAPP ? { target: '_blank', rel: 'noopener' } : {})}>
      <LogoWhatsApp />{texte}
    </a>
  );
}

// Un site d'artisan en miniature, dessiné en HTML : ce que l'artisan aura.
type Exemple = { nom: string; metier: string; ville: string; photo: string | null; cadre: string; style: CSSProperties; accroche: string };
const EXEMPLES: Exemple[] = [
  { nom: 'Façades Morel', metier: 'Ravalement de façade', ville: 'Aubagne', photo: PHOTOS.apres, cadre: '50% 50%', accroche: 'Des façades refaites pour vingt ans', style: { '--fond': '#f4efe6', '--encre': '#2a2420', '--marque': '#9a4a2c' } as CSSProperties },
  { nom: 'Toitures du Garlaban', metier: 'Couverture et zinguerie', ville: 'Marseille', photo: PHOTOS.couvreur, cadre: '28% 40%', accroche: 'Votre toit, tuile par tuile', style: { '--fond': '#0f1d2b', '--encre': '#f2f4f7', '--marque': '#e8a33c' } as CSSProperties },
  { nom: 'Atelier Blanc Lumière', metier: 'Peinture intérieure', ville: 'Aix-en-Provence', photo: PHOTOS.peintre, cadre: '50% 50%', accroche: 'Des pièces qui respirent', style: { '--fond': '#fbfaf7', '--encre': '#1d2b26', '--marque': '#3f7d6a' } as CSSProperties },
];

function MiniSite({ e, format }: { e: Exemple; format: 'ordinateur' | 'telephone' }) {
  return (
    <div className={`m-mini m-mini--${format}`} style={e.style}>
      <div className="m-mini-barre"><strong>{e.nom}</strong><span className="m-mini-appel">Appeler</span></div>
      <div className="m-mini-une">
        <Photo src={e.photo} alt="" cadre={e.cadre} />
        <div className="m-mini-texte">
          <span className="m-mini-metier">{e.metier} à {e.ville}</span>
          <span className="m-mini-titre">{e.accroche}</span>
          <span className="m-mini-cta">Demander un devis</span>
        </div>
      </div>
      <div className="m-mini-bas"><span><Etoiles />Avis Google</span><span>Chantiers récents</span></div>
    </div>
  );
}

function Ordinateur({ children }: { children: ReactNode }) {
  return <div className="m-ordi" aria-hidden="true"><div className="m-ordi-ecran"><div className="m-ordi-points"><i /><i /><i /></div>{children}</div><div className="m-ordi-pied" /></div>;
}
function Telephone({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`m-tel ${className}`} aria-hidden="true"><div className="m-tel-ecran">{children}</div></div>;
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

// ------------------------------------------------------------------ contenu
const INCLUS = [
  { i: I.maison, t: 'Un vrai site à votre nom', d: 'Fait pour votre métier et votre secteur, différent de celui du voisin.' },
  { i: I.globe, t: 'Votre nom de domaine', d: 'En .fr ou .com, acheté à votre nom. Il est à vous, même si vous partez.' },
  { i: I.photo, t: 'Vos chantiers en photos', d: 'Avant, après : vous les ajoutez depuis votre téléphone, le site se met à jour.' },
  { i: I.etoile, t: 'Vos avis Google affichés', d: 'Les clients voient ce que les autres pensent de votre travail.' },
  { i: I.tel, t: 'Des clients qui vous appellent', d: 'Un bouton pour appeler, un formulaire de devis, sur téléphone comme sur ordinateur.' },
  { i: I.loupe, t: 'Fait pour Google', d: 'Votre métier et votre ville, écrits pour que les clients du coin vous trouvent.' },
];

const ETAPES = [
  { t: 'Votre maquette, offerte', d: 'On prépare votre site à votre nom, avec vos photos ou des images d’exemple. Vous le voyez avant de payer.' },
  { t: 'Vous choisissez', d: `Au mois avec ${OFFRE.moisOfferts} mois offert, ou à l’année. Rien à faire de technique.` },
  { t: 'Votre site est en ligne', d: 'Avec votre nom de domaine, votre numéro, vos avis.' },
  { t: 'Vous ajoutez vos chantiers', d: 'Trois gestes sur votre téléphone : photo avant, photo après, c’est publié.' },
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
  // Le bouton flottant n'apparaît qu'une fois le bouton du haut sorti de l'écran.
  const haut = useRef<HTMLDivElement>(null);
  const [flottant, setFlottant] = useState(false);
  useEffect(() => {
    const el = haut.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const o = new IntersectionObserver(([e]) => setFlottant(!e.isIntersecting && e.boundingClientRect.top < 0));
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return (
    <div className="m">
      <a className="m-aller" href="#m-contenu">Aller au contenu</a>
      <header className="m-entete">
        <a className="m-logo" href="#/" aria-label="MonSiteArtisan.com, accueil">
          <span className="m-logo-icone" aria-hidden="true"><Icone d={I.maison} taille={18} /></span>
          <span className="m-logo-nom">MonSiteArtisan<span>.com</span></span>
        </a>
        <nav aria-label="Navigation de la page">
          <a href="#inclus">Ce qui est compris</a>
          <a href="#exemples">Exemples</a>
          <a href="#prix">Prix</a>
          <a href="#questions">Questions</a>
        </nav>
        <a className="m-espace" href="#/connexion">Espace artisan</a>
      </header>

      <main id="m-contenu" tabIndex={-1}>
        {/* ---------------------------------------------------- haut de page : la photo en grand, rien dessus */}
        <section className="m-une" aria-labelledby="m-titre">
          <div className="m-une-texte">
            <h1 id="m-titre">Vos clients vous cherchent sur internet<span className="m-pt">.</span> Soyez là<span className="m-pt">.</span></h1>
            <p className="m-une-chapeau">Un site pro à votre nom, avec vos chantiers en photos, fait pour que les clients du coin vous appellent. Vous voyez la maquette avant de payer.</p>
            <div className="m-une-actions" ref={haut}>
              <BoutonMaquette />
              <a className="m-lien" href="#prix">Voir les prix</a>
            </div>
            <ul className="m-une-preuves">
              <li><strong>{euros(OFFRE.prixMois)}</strong><span>par mois, tout compris</span></li>
              <li><strong>0 €</strong><span>pour voir votre maquette</span></li>
              <li><strong>.fr</strong><span>nom de domaine à vous</span></li>
            </ul>
          </div>
          <div className="m-une-visuel">
            <Photo src={PHOTOS.facadier} alt="Un façadier regarde son téléphone devant la façade qu’il vient de refaire" className="m-une-photo" cadre="24% 45%" />
            <div className="m-notif" aria-hidden="true">
              <span className="m-notif-icone"><Icone d={I.tel} taille={18} /></span>
              <span><strong>Nouvelle demande de devis</strong>Ravalement 120 m², Aubagne</span>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- ce que voit le client qui cherche */}
        <section className="m-section m-recherche" aria-labelledby="m-t-recherche">
          <div className="m-recherche-texte">
            <h2 id="m-t-recherche">Un client cherche un façadier<span className="m-pt">.</span> Il tombe sur vous<span className="m-pt">.</span></h2>
            <p>Avant d’appeler un artisan, un client regarde sur internet. Il compare les photos, les avis, et il appelle celui qui lui inspire confiance.</p>
            <p>Votre site est écrit avec votre métier et votre ville, pour que ce client-là trouve votre numéro.</p>
          </div>
          <div className="m-moteur" aria-hidden="true">
            <div className="m-moteur-barre"><Icone d={I.loupe} taille={18} /><span>façadier Aubagne</span></div>
            <div className="m-resultat m-resultat--vous">
              <span className="m-resultat-adresse">www.votre-entreprise.fr</span>
              <span className="m-resultat-titre">Votre entreprise : ravalement de façade à Aubagne</span>
              <span className="m-resultat-note"><Etoiles />Avis Google</span>
              <span className="m-resultat-texte">Façades refaites, enduits, peinture extérieure. Devis gratuit, chantiers en photos.</span>
              <span className="m-resultat-photos">
                <Photo src={PHOTOS.avant} alt="" /><Photo src={PHOTOS.apres} alt="" /><Photo src={PHOTOS.facadier} alt="" cadre="24% 45%" />
              </span>
              <span className="m-resultat-actions"><span className="m-resultat-appel"><Icone d={I.tel} taille={14} />Appeler</span><span>Demander un devis</span></span>
            </div>
            <div className="m-resultat m-resultat--gris"><i /><i /><i /></div>
            <div className="m-resultat m-resultat--gris"><i /><i /><i /></div>
          </div>
        </section>

        {/* ---------------------------------------------------- avant / après */}
        <section className="m-section m-chantiers" aria-labelledby="m-t-chantiers">
          <div className="m-chantiers-texte">
            <h2 id="m-t-chantiers">Vos chantiers parlent pour vous</h2>
            <p>Un client hésite entre trois artisans. Il choisit celui dont il voit le travail. Sur votre site, chaque chantier apparaît en avant et après, comme ici : glissez pour voir.</p>
            <p className="m-discret">Les photos partent de votre téléphone. Vous n’avez rien d’autre à faire.</p>
          </div>
          <AvantApres />
        </section>

        {/* ---------------------------------------------------- ce qui est compris */}
        <section id="inclus" className="m-section" aria-labelledby="m-t-inclus">
          <div className="m-titre-section">
            <h2 id="m-t-inclus">Tout est compris, vous n’avez rien à gérer</h2>
            <p>Une seule formule, le site complet. Pas de frais de création, pas d’options cachées.</p>
          </div>
          <ul className="m-tuiles">
            {INCLUS.map((x) => (
              <li key={x.t} className="m-tuile">
                <span className="m-tuile-icone"><Icone d={x.i} /></span>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------- exemples */}
        <section id="exemples" className="m-section m-exemples" aria-labelledby="m-t-exemples">
          <div className="m-titre-section">
            <h2 id="m-t-exemples">Un site différent pour chaque artisan</h2>
            <p>Couleurs, mise en page, textes : chaque site est fait pour une entreprise et ne ressemble pas à celui du concurrent. Trois exemples :</p>
          </div>
          <div className="m-exemples-liste">
            {EXEMPLES.map((e) => (
              <figure key={e.nom} className="m-exemple">
                <div className="m-exemple-appareils">
                  <Ordinateur><MiniSite e={e} format="ordinateur" /></Ordinateur>
                  <Telephone className="m-exemple-tel"><MiniSite e={e} format="telephone" /></Telephone>
                </div>
                <figcaption>{e.metier}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- l'app */}
        <section className="m-section m-app" aria-labelledby="m-t-app">
          <Photo src={PHOTOS.telephone} alt="Un artisan prend en photo une façade qu’il vient de finir" className="m-app-photo" />
          <div className="m-app-texte">
            <h2 id="m-t-app">Votre site se met à jour depuis votre téléphone</h2>
            <ol className="m-gestes">
              <li><strong>Ouvrez le chantier</strong><span>dans l’app, sur l’écran d’accueil de votre téléphone</span></li>
              <li><strong>Photo avant, photo après</strong><span>comme une photo normale</span></li>
              <li><strong>C’est publié</strong><span>le chantier apparaît sur votre site</span></li>
            </ol>
            <p className="m-discret">Pas de store, pas de mot de passe à inventer : votre identifiant vous est donné quand votre site est en ligne.</p>
            <div className="m-une-actions">
              <a className="m-bouton m-bouton--noir" href="#/connexion">Espace artisan</a>
              <a className="m-lien" href="#/installer">Installer l’app</a>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- étapes */}
        <section className="m-section" aria-labelledby="m-t-etapes">
          <div className="m-titre-section">
            <h2 id="m-t-etapes">Comment ça se passe</h2>
          </div>
          <ol className="m-etapes">
            {ETAPES.map((e) => <li key={e.t}><h3>{e.t}</h3><p>{e.d}</p></li>)}
          </ol>
        </section>

        {/* ---------------------------------------------------- prix */}
        <section id="prix" className="m-section m-prix" aria-labelledby="m-t-prix">
          <div className="m-titre-section">
            <h2 id="m-t-prix">Des prix clairs</h2>
            <p>Le même site complet. Vous choisissez seulement comment payer.</p>
          </div>
          <div className="m-cartes">
            <article className="m-carte" aria-labelledby="m-c-mois">
              <h3 id="m-c-mois">Au mois</h3>
              <p className="m-carte-prix"><strong>{euros(OFFRE.prixMois)}</strong><span>par mois</span></p>
              <p className="m-carte-offert">{OFFRE.moisOfferts} mois offert pour commencer</p>
              <ul>{['Site complet à votre nom', 'Nom de domaine .fr ou .com', 'Hébergement et mises à jour', 'Vos photos depuis le téléphone', 'Avis Google sur le site'].map((l) => <li key={l}><Icone d={I.coche} taille={18} />{l}</li>)}</ul>
              <p className="m-carte-note">Engagement {OFFRE.engagementMois} mois</p>
              <BoutonMaquette variante="noir" />
            </article>
            <article className="m-carte m-carte--an" aria-labelledby="m-c-an">
              <p className="m-carte-badge">{euros(economie)} d’économie</p>
              <h3 id="m-c-an">À l’année</h3>
              <p className="m-carte-prix"><strong>{euros(OFFRE.prixAn)}</strong><span>par an</span></p>
              <p className="m-carte-offert">Soit {euros(OFFRE.prixAn / 12)} par mois</p>
              <ul>{['Tout ce qui est compris au mois', 'Payé une fois par an', 'Renouvelé si vous le voulez'].map((l) => <li key={l}><Icone d={I.coche} taille={18} />{l}</li>)}</ul>
              <p className="m-carte-note">Sans mois offert</p>
              <BoutonMaquette variante="jaune" />
            </article>
          </div>
          <p className="m-tva">{MENTION_TVA}.</p>
          <aside className="m-vitrines" aria-labelledby="m-t-vitrines">
            <div>
              <h3 id="m-t-vitrines">{OFFRE.placesVitrine} artisans vitrines : {OFFRE.moisOffertsVitrine} mois offerts</h3>
              <p>Nos {OFFRE.placesVitrine} premiers sites servent d’exemple aux artisans qui viendront après. En échange, {OFFRE.moisOffertsVitrine} mois offerts, puis {euros(OFFRE.prixMois)} par mois.</p>
            </div>
            <BoutonMaquette texte="Être artisan vitrine" variante="blanc" />
          </aside>
        </section>

        {/* ---------------------------------------------------- questions */}
        <section id="questions" className="m-section m-questions" aria-labelledby="m-t-questions">
          <div className="m-titre-section"><h2 id="m-t-questions">Vos questions</h2></div>
          <div className="m-faq">
            {QUESTIONS.map((x) => <details key={x.q}><summary>{x.q}</summary><p>{x.r}</p></details>)}
          </div>
        </section>

        {/* ---------------------------------------------------- fin */}
        <section id="contact" className="m-fin" aria-labelledby="m-t-fin">
          <Photo src={PHOTOS.apres} alt="" className="m-fin-photo" />
          <div className="m-fin-texte">
            <h2 id="m-t-fin">Voyez votre site avant de payer</h2>
            <p>Envoyez-nous le nom de votre entreprise sur WhatsApp : on vous prépare la maquette de votre site.</p>
            {WHATSAPP ? <BoutonMaquette /> : <p className="m-bientot">Le numéro WhatsApp arrive très bientôt sur cette page.</p>}
          </div>
        </section>
      </main>

      <footer className="m-pied">
        <span className="m-logo"><span className="m-logo-nom">MonSiteArtisan<span>.com</span></span></span>
        <a href="#/connexion">Espace artisan</a>
        <a href="#/installer">Installer l’app</a>
        <span className="m-pied-droit">© 2026 MonSiteArtisan.com</span>
      </footer>

      <BoutonMaquette texte="Ma maquette gratuite" className={`m-flottant ${flottant ? 'm-flottant--vu' : ''}`} />
    </div>
  );
}

export default Vitrine;
