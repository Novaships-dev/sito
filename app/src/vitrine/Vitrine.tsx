// La page de MonSiteArtisan : ce qu'on fait, combien ça coûte, comment demander sa
// maquette. C'est aussi la porte de l'espace artisan (décision du 5 nov. 2026 :
// « un site simple qui explique ce qu'on fait », à mettre sur l'écran
// d'accueil). Chargée à part : l'espace artisan n'en porte pas le poids.
//
// L'idée de la page : le haut est un panneau de chantier, les prix sont un
// devis. Le vocabulaire est celui de l'artisan, pas celui d'une agence.
import '@fontsource-variable/archivo/wdth.css';
import './vitrine.css';
import { OFFRE, MENTION_TVA, WHATSAPP, lienWhatsApp, euros } from './offre';

const tva = MENTION_TVA ? ` ${MENTION_TVA}` : '';

function BoutonWhatsApp({ texte, variante = 'plein' }: { texte: string; variante?: 'plein' | 'clair' }) {
  const externe = Boolean(WHATSAPP);
  return (
    <a className={`v-bouton v-bouton--${variante}`} href={lienWhatsApp()}
      {...(externe ? { target: '_blank', rel: 'noopener' } : {})}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" /></svg>
      {texte}
    </a>
  );
}

const DEVIS_LIGNES = [
  'Votre site complet, à votre nom',
  'Nom de domaine en .fr ou .com',
  'Hébergement et mises à jour',
  'Vos photos de chantier ajoutées depuis votre téléphone',
  'Vos avis Google affichés sur le site',
  'Bouton d’appel et formulaire de demande de devis',
];

const ETAPES = [
  { titre: 'On vous montre votre site', texte: 'Une maquette à votre nom, avec vos photos si vous en avez, sinon des images d’exemple. Gratuite, sans engagement.' },
  { titre: 'Vous choisissez votre formule', texte: `Au mois, avec ${OFFRE.moisOfferts} mois offert, ou à l’année. Le paiement se fait par carte.` },
  { titre: 'Votre site est en ligne', texte: 'Avec votre nom de domaine. Il est à vous : si vous partez un jour, vous le gardez.' },
  { titre: 'Vous ajoutez vos chantiers', texte: 'Depuis votre téléphone, en trois gestes. Le site se met à jour tout seul avec vos photos avant et après.' },
];

const QUESTIONS = [
  { q: 'Je ne suis pas à l’aise avec internet. C’est pour moi ?', r: 'Oui. On s’occupe de tout : les textes, la mise en ligne, le nom de domaine. Vous, vous envoyez des photos depuis votre téléphone, comme sur WhatsApp.' },
  { q: 'Je n’ai pas de belles photos de mes chantiers.', r: 'La maquette se fait avec des images d’exemple, marquées comme telles. Vous les remplacez par les vôtres quand vous voulez, au fil des chantiers.' },
  { q: 'Je m’engage pour combien de temps ?', r: `Au mois, l’engagement est de ${OFFRE.engagementMois} mois, parce que le nom de domaine se paie à l’année. À l’année, vous payez ${euros(OFFRE.prixAn)} une fois, renouvelé l’année suivante si vous le voulez.` },
  { q: 'Le nom de domaine est à qui ?', r: 'À vous. Il est acheté à votre nom au premier paiement. Si vous arrêtez, vous le gardez et vous pouvez l’emmener ailleurs.' },
  { q: 'Qui écrit les textes du site ?', r: 'Nous. Ils parlent de votre métier, de votre secteur et de vos chantiers. Vous les relisez sur la maquette avant que le site soit en ligne.' },
  { q: 'Et si la maquette ne me plaît pas ?', r: 'Vous ne payez rien. La maquette est offerte, vous dites ce qu’il faut changer, ou vous en restez là.' },
];

export function Vitrine() {
  return (
    <div className="v">
      <a className="v-aller" href="#v-contenu">Aller au contenu</a>
      <header className="v-barre">
        <a className="v-marque" href="#/" aria-label="MonSiteArtisan.com, accueil">MonSiteArtisan<span>.com</span></a>
        <nav aria-label="Navigation de la page">
          <a href="#devis">Prix</a>
          <a href="#etapes">Comment ça marche</a>
          <a href="#questions">Questions</a>
          <a className="v-espace" href="#/connexion">Espace artisan</a>
        </nav>
      </header>

      <main id="v-contenu" tabIndex={-1}>
        <section className="v-chantier" aria-labelledby="v-titre">
          <div className="v-panneau">
            <div className="v-ruban" aria-hidden="true" />
            <p className="v-panneau-tete">Chantier</p>
            <h1 id="v-titre">Votre site internet d’artisan</h1>
            <dl className="v-rubriques">
              <div><dt>Nature des travaux</dt><dd>Création et entretien de votre site</dd></div>
              <div><dt>Pour</dt><dd>Les artisans du bâtiment</dd></div>
              <div><dt>Avant de payer</dt><dd>La maquette de votre site, offerte</dd></div>
              <div className="v-montant"><dt>Montant</dt><dd>{euros(OFFRE.prixMois)} par mois{tva}<span>ou {euros(OFFRE.prixAn)} l’année</span></dd></div>
            </dl>
            <div className="v-panneau-action"><BoutonWhatsApp texte="Recevoir ma maquette gratuite" /></div>
            <span className="v-vis v-vis--1" aria-hidden="true" /><span className="v-vis v-vis--2" aria-hidden="true" />
            <span className="v-vis v-vis--3" aria-hidden="true" /><span className="v-vis v-vis--4" aria-hidden="true" />
          </div>
          <div className="v-accroche">
            <p className="v-intro">Vous faites les chantiers. On fait le site qui vous en ramène.</p>
            <p>Un vrai site à votre nom, fait pour être trouvé sur Google, avec vos photos avant et après, vos avis et un bouton pour vous appeler. Vous voyez votre site avant de payer quoi que ce soit.</p>
            <div className="v-actions">
              <a className="v-lien" href="#devis">Voir le devis complet</a>
              <a className="v-lien" href="#etapes">Comment ça se passe</a>
            </div>
          </div>
        </section>

        <section id="devis" className="v-section v-devis" aria-labelledby="v-t-devis">
          <h2 id="v-t-devis">Le devis, sans surprise</h2>
          <p className="v-chapeau">Une seule formule : le site complet. Vous choisissez seulement comment vous payez.</p>
          <div className="v-feuilles">
            {[
              { id: 'mois', titre: 'Au mois', prix: OFFRE.prixMois, unite: 'par mois', notes: [`${OFFRE.moisOfferts} mois offert pour commencer`, `Engagement ${OFFRE.engagementMois} mois`] },
              { id: 'an', titre: 'À l’année', prix: OFFRE.prixAn, unite: 'par an', notes: [`Soit ${euros(OFFRE.prixAn / 12)} par mois`, 'Payé une fois, renouvelé chaque année'] },
            ].map((f) => (
              <article key={f.id} className={`v-feuille v-feuille--${f.id}`} aria-labelledby={`v-f-${f.id}`}>
                <h3 id={`v-f-${f.id}`}>{f.titre}</h3>
                <ul className="v-lignes">
                  {DEVIS_LIGNES.map((l) => <li key={l}><span>{l}</span><span className="v-compris">compris</span></li>)}
                </ul>
                <p className="v-total"><span>Total</span><strong>{euros(f.prix)}</strong><span className="v-unite">{f.unite}{tva}</span></p>
                <ul className="v-notes">{f.notes.map((n) => <li key={n}>{n}</li>)}</ul>
              </article>
            ))}
          </div>
          <aside className="v-vitrines" aria-labelledby="v-t-vitrines">
            <h3 id="v-t-vitrines">{OFFRE.placesVitrine} artisans vitrines : {OFFRE.moisOffertsVitrine} mois offerts</h3>
            <p>Nos {OFFRE.placesVitrine} premiers sites servent d’exemple aux artisans qui viendront après. En échange, ces {OFFRE.placesVitrine} artisans ont {OFFRE.moisOffertsVitrine} mois offerts, puis {euros(OFFRE.prixMois)} par mois.</p>
            <BoutonWhatsApp texte="Être artisan vitrine" variante="clair" />
          </aside>
        </section>

        <section id="etapes" className="v-section v-etapes" aria-labelledby="v-t-etapes">
          <h2 id="v-t-etapes">Comment ça se passe</h2>
          <ol>
            {ETAPES.map((e) => <li key={e.titre}><h3>{e.titre}</h3><p>{e.texte}</p></li>)}
          </ol>
        </section>

        <section className="v-section v-app" aria-labelledby="v-t-app">
          <div className="v-app-texte">
            <h2 id="v-t-app">Vos chantiers, depuis votre téléphone</h2>
            <p>L’app MonSiteArtisan se met sur l’écran d’accueil de votre téléphone, sans passer par un store. Vous ouvrez le chantier, vous prenez la photo avant, puis la photo après. C’est tout : votre site se met à jour.</p>
            <p>Votre identifiant et votre mot de passe vous sont donnés quand votre site est en ligne.</p>
            <div className="v-actions">
              <a className="v-bouton v-bouton--sombre" href="#/connexion">Espace artisan</a>
              <a className="v-lien" href="#/installer">Installer l’app</a>
            </div>
          </div>
          <div className="v-telephone" aria-hidden="true">
            <div className="v-ecran">
              <p className="v-ecran-titre">Ravalement, rue Paradis</p>
              <div className="v-tuiles">
                <div className="v-tuile v-tuile--avant"><span>Avant</span></div>
                <div className="v-tuile v-tuile--apres"><span>Après</span></div>
              </div>
              <div className="v-envoi"><span>Envoi des photos</span><span className="v-barre-envoi"><span /></span></div>
              <p className="v-ecran-ok">Sur votre site</p>
            </div>
          </div>
        </section>

        <section id="questions" className="v-section v-questions" aria-labelledby="v-t-questions">
          <h2 id="v-t-questions">Vos questions</h2>
          <div className="v-faq">
            {QUESTIONS.map((x) => <details key={x.q}><summary>{x.q}</summary><p>{x.r}</p></details>)}
          </div>
        </section>

        <section id="contact" className="v-fin" aria-labelledby="v-t-fin">
          <h2 id="v-t-fin">Voyez votre site avant de payer</h2>
          <p>Écrivez-nous sur WhatsApp avec le nom de votre entreprise : on vous envoie la maquette de votre site.</p>
          {WHATSAPP ? <BoutonWhatsApp texte="Recevoir ma maquette gratuite" /> : <p className="v-bientot">Le numéro WhatsApp de MonSiteArtisan arrive très bientôt sur cette page.</p>}
        </section>
      </main>

      <footer className="v-pied">
        <span className="v-marque">MonSiteArtisan<span>.com</span></span>
        <a href="#/connexion">Espace artisan</a>
        <a href="#/installer">Installer l’app</a>
        <span>© 2026 MonSiteArtisan.com</span>
      </footer>
    </div>
  );
}

export default Vitrine;
