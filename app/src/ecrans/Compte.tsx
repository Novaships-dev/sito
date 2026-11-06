// Mon compte : le site (téléphone, prix, tarifs), les mentions légales, l'export
// des données, la suppression, la déconnexion (T61, décision du 5 nov. 2026).
import { useEffect, useState } from 'react';
import { useApp, useCharge, Chargement, Ecran, useAction, Message } from '../ui';
import { dateLisible } from '../jour';
import type { Profil } from '../types';
import { MonSite } from './MonSite';

export function Compte() {
  const { donnees } = useApp();
  const qui = useCharge((d) => d.utilisateur());
  const ent = useCharge((d) => d.entreprise());
  const profil = useCharge((d) => d.profil());
  const sortie = useAction();

  return (
    <Ecran titre="Mon compte">
      <section className="carte">
        <Chargement {...ent} />
        {ent.valeur && <p><strong>{ent.valeur.nom_affiche}</strong><br /><span className="discret">SIREN {ent.valeur.siren.replace(/(\d{3})(?=\d)/g, '$1 ')}{ent.valeur.commune ? `, ${ent.valeur.commune}` : ''}</span></p>}
        {qui.valeur && <p className="discret">Connecté avec {qui.valeur.courriel}</p>}
        <button className="bouton secondaire" disabled={sortie.occupe} onClick={() => void sortie.lancer(() => donnees.deconnecter())}>Me déconnecter</button>
        <Message erreur={sortie.erreur} />
      </section>

      <MonSite />
      <Chargement {...profil} />
      {profil.valeur && <Mentions profil={profil.valeur} apres={profil.recharger} />}
      <Export />
      <Suppression />
      <section className="carte"><a className="bouton secondaire" href="#/installer">Installer l’app sur mon téléphone</a></section>
    </Ecran>
  );
}

// Les mentions obligatoires du site (docs/specs/S-MENTIONS.md) : ce que
// l'annuaire des entreprises ne donne pas. Sans adresse électronique ni
// directeur de la publication, le site ne peut pas être mis en ligne (T50).
function Mentions({ profil, apres }: { profil: Profil; apres: () => void }) {
  const { donnees } = useApp();
  const champs = ['courriel', 'directeur_publication', 'capital_social', 'immatriculation', 'tva_intra',
    'decennale_assureur', 'decennale_contrat', 'decennale_zone', 'mediateur_nom', 'mediateur_adresse', 'mediateur_site'] as const;
  type Champ = typeof champs[number];
  const depuis = (p: Profil) => Object.fromEntries(champs.map((c) => [c, p[c] || ''])) as Record<Champ, string>;
  const [v, setV] = useState(depuis(profil));
  useEffect(() => setV(depuis(profil)), [profil]);
  const a = useAction();

  const tva = v.tva_intra.replace(/\s/g, '').toUpperCase();
  const tvaOk = tva === '' || /^FR[0-9A-Z]{2}[0-9]{9}$/.test(tva);
  const siteOk = v.mediateur_site.trim() === '' || /^https:\/\/\S+$/.test(v.mediateur_site.trim());
  const courrielOk = v.courriel.trim() === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.courriel.trim());
  // Ce qui manque encore pour la mise en ligne, d'après ce qui est enregistré.
  const manque = [!profil.telephone && 'le téléphone (écran « Mon site »)', !profil.courriel && 'l’adresse électronique',
    !profil.directeur_publication && 'le directeur de la publication'].filter(Boolean) as string[];
  const champ = (c: Champ, libelle: string, aide?: string, extra?: Record<string, unknown>) => (
    <>
      <label htmlFor={c}>{libelle}</label>
      {aide && <p className="aide" id={`aide-${c}`}>{aide}</p>}
      <input id={c} value={v[c]} aria-describedby={aide ? `aide-${c}` : undefined} onChange={(e) => setV({ ...v, [c]: e.target.value })} {...extra} />
    </>
  );

  return (
    <form className="carte" onSubmit={async (e) => {
      e.preventDefault();
      if (!tvaOk || !siteOk || !courrielOk) return;
      const p: Partial<Profil> = { tva_intra: tva || null };
      for (const c of champs) if (c !== 'tva_intra') p[c] = v[c].trim() || null;
      if (await a.lancer(() => donnees.enregistrerProfil(p), 'Enregistré. Les mentions légales du site seront mises à jour.')) apres();
    }}>
      <h2>Mentions légales du site</h2>
      <p className="aide">Obligatoires sur le site d’un artisan. Elles apparaissent sur la page « Mentions légales ». Le nom, la forme, le siège et le SIREN viennent de l’annuaire des entreprises.</p>
      {manque.length > 0 && <p className="erreur" role="status">Avant la mise en ligne, il manque : {manque.join(', ')}.</p>}
      {champ('courriel', 'Adresse électronique affichée sur le site', 'Obligatoire : la loi demande un moyen de vous écrire.', { type: 'email', inputMode: 'email', maxLength: 254, 'aria-invalid': !courrielOk })}
      {!courrielOk && <p className="erreur">Adresse électronique invalide.</p>}
      {champ('directeur_publication', 'Directeur de la publication', 'Obligatoire : le représentant légal de l’entreprise (vous, si vous êtes entrepreneur individuel).', { maxLength: 140, autoComplete: 'name' })}
      {champ('capital_social', 'Capital social', 'Pour une société. Par exemple : 10 000 €.', { maxLength: 40 })}
      {champ('immatriculation', 'Immatriculation', 'Par exemple : RCS Marseille 480 423 623. Laissez vide : le site indique le SIREN et le registre national des entreprises.', { maxLength: 140 })}
      {champ('tva_intra', 'Numéro de TVA intracommunautaire', 'Laissez vide si vous êtes en franchise de TVA.', { autoCapitalize: 'characters', 'aria-invalid': !tvaOk })}
      {!tvaOk && <p className="erreur">Format attendu : FR suivi de 11 caractères (par exemple FR12345678901).</p>}
      {champ('decennale_assureur', 'Assureur décennale', undefined, { maxLength: 140 })}
      {champ('decennale_contrat', 'Numéro de contrat', undefined, { maxLength: 60 })}
      {champ('decennale_zone', 'Zone couverte', 'Par exemple : France métropolitaine.', { maxLength: 140 })}
      {champ('mediateur_nom', 'Médiateur de la consommation', 'Obligatoire si vous travaillez pour des particuliers.', { maxLength: 140 })}
      {champ('mediateur_adresse', 'Adresse postale du médiateur', undefined, { maxLength: 280 })}
      {champ('mediateur_site', 'Site du médiateur', undefined, { type: 'url', inputMode: 'url', placeholder: 'https://', 'aria-invalid': !siteOk })}
      {!siteOk && <p className="erreur">L’adresse doit commencer par https://</p>}
      <Message erreur={a.erreur} fait={a.fait} />
      <button className="bouton" disabled={a.occupe || !tvaOk || !siteOk || !courrielOk}>Enregistrer</button>
    </form>
  );
}

// Toutes mes données, dans un fichier que je garde (RGPD, droit à la portabilité).
function Export() {
  const { donnees } = useApp();
  const a = useAction();
  return (
    <section className="carte" aria-labelledby="t-export">
      <h2 id="t-export">Mes données</h2>
      <p className="aide">Un fichier avec tout ce que MonSiteArtisan garde sur vous : entreprise, réglages, tarifs, chantiers, demandes, avis, statistiques. Les photos restent consultables dans « Mes chantiers ».</p>
      <button className="bouton secondaire" disabled={a.occupe} onClick={() => void a.lancer(async () => {
        const chantiers = await donnees.chantiers();
        const tout = {
          exporte_le: new Date().toISOString(),
          entreprise: await donnees.entreprise(), profil: await donnees.profil(), tarifs: await donnees.tarifs(),
          chantiers: await Promise.all(chantiers.map(async (c) => ({ ...c, photos: (await donnees.photos(c.id)).map(({ apercu: _a, ...p }) => p) }))),
          demandes: await donnees.demandes(), avis: await donnees.avis(), statistiques: await donnees.statistiques(400),
          site: await donnees.site(), adresses: await donnees.adresses(), abonnement: await donnees.abonnement(),
        };
        const lien = document.createElement('a');
        lien.href = URL.createObjectURL(new Blob([JSON.stringify(tout, null, 2)], { type: 'application/json' }));
        lien.download = `sito-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.append(lien); lien.click(); lien.remove();
        setTimeout(() => URL.revokeObjectURL(lien.href), 10_000);
      }, 'Fichier téléchargé.')}>{a.occupe ? 'Préparation…' : 'Télécharger mes données'}</button>
      <Message erreur={a.erreur} fait={a.fait} />
    </section>
  );
}

// 30 jours pour changer d'avis ; le service supprime à l'échéance.
function Suppression() {
  const { donnees } = useApp();
  const s = useCharge((d) => d.suppression());
  const [confirmation, setConfirmation] = useState('');
  const a = useAction();
  const enCours = s.valeur && !s.valeur.annulee_le ? s.valeur : null;

  return (
    <section className="carte danger" aria-labelledby="t-suppr">
      <h2 id="t-suppr">Supprimer mon compte</h2>
      <Chargement {...s} />
      {enCours ? (
        <>
          <p>Suppression demandée le {dateLisible(enCours.demandee_le)}. Votre compte, votre site et vos photos seront supprimés le <strong>{dateLisible(enCours.effective_le)}</strong>.</p>
          <button className="bouton" disabled={a.occupe} onClick={async () => { if (await a.lancer(() => donnees.annulerSuppression())) void s.recharger(); }}>Annuler la suppression</button>
        </>
      ) : !s.charge && !s.erreur && (
        <form onSubmit={async (e) => { e.preventDefault(); if (await a.lancer(() => donnees.demanderSuppression())) { setConfirmation(''); void s.recharger(); } }}>
          <p>Votre site sera retiré, vos photos et vos données effacées <strong>30 jours</strong> après la demande. Vous pouvez annuler pendant ces 30 jours. Pensez à télécharger vos données avant.</p>
          <label htmlFor="confirm-suppr">Pour confirmer, écrivez SUPPRIMER</label>
          <input id="confirm-suppr" autoComplete="off" autoCapitalize="characters" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          <button className="bouton danger" disabled={a.occupe || confirmation.trim().toUpperCase() !== 'SUPPRIMER'}>Demander la suppression</button>
        </form>
      )}
      <Message erreur={a.erreur} />
    </section>
  );
}
