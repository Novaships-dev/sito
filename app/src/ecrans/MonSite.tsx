// Mon site : l'état du site, le téléphone, la case « afficher mes prix » et les tarifs.
// Décision du 2 octobre : « c'est l'artisan qui coche une case pour activer ça
// ou pas, et ensuite ajouter ses tarifs ».
import { useEffect, useState } from 'react';
import { useApp, useCharge, Chargement, Ecran, useAction, Message, Pastille, euros } from '../ui';
import { dateLisible } from '../jour';
import type { Profil, Tarif } from '../types';

const STATUTS: Record<string, { texte: string; ton: 'ok' | 'attente' | 'probleme' | 'neutre' }> = {
  publie: { texte: 'En ligne', ton: 'ok' },
  abonne: { texte: 'En préparation', ton: 'attente' },
  prospection: { texte: 'Pas encore en ligne', ton: 'neutre' },
  suspendu: { texte: 'Suspendu', ton: 'probleme' },
  archive: { texte: 'Archivé', ton: 'neutre' },
};

export function MonSite() {
  const site = useCharge((d) => d.site());
  const profil = useCharge((d) => d.profil());
  const tarifs = useCharge((d) => d.tarifs());
  const s = site.valeur;
  const statut = s ? STATUTS[s.statut] || { texte: s.statut, ton: 'neutre' as const } : null;

  return (
    <Ecran titre="Mon site">
      <section className="carte" aria-labelledby="t-etat">
        <h2 id="t-etat">État</h2>
        <Chargement {...site} />
        {site.valeur === null && <p>Votre site n’est pas encore créé.</p>}
        {s && statut && (
          <>
            <p><Pastille ton={statut.ton}>{statut.texte}</Pastille>{s.publie_le && <span className="discret"> · mis à jour le {dateLisible(s.publie_le)}</span>}</p>
            {s.adresse_en_ligne && <a className="bouton secondaire" href={s.adresse_en_ligne} target="_blank" rel="noopener">Voir mon site</a>}
            <p className="aide">Chaque photo ajoutée met le site à jour : la nouvelle version remplace l’ancienne d’un coup, jamais à moitié.</p>
          </>
        )}
      </section>

      <Chargement {...profil} />
      {profil.valeur && <FormProfil profil={profil.valeur} apres={profil.recharger} />}

      {profil.valeur?.prix_affiches && (
        <section className="carte" aria-labelledby="t-tarifs">
          <h2 id="t-tarifs">Mes tarifs</h2>
          <p className="aide">Prix indicatifs, affichés sur le site. Une fourchette rassure plus qu’un prix unique.</p>
          <Chargement {...tarifs} />
          <ul className="liste">
            {(tarifs.valeur || []).map((t) => <li key={t.id}><LigneTarif tarif={t} apres={tarifs.recharger} /></li>)}
          </ul>
          <LigneTarif rang={(tarifs.valeur || []).length} apres={tarifs.recharger} />
        </section>
      )}
    </Ecran>
  );
}

function FormProfil({ profil, apres }: { profil: Profil; apres: () => void }) {
  const { donnees } = useApp();
  const [telephone, setTelephone] = useState(profil.telephone || '');
  const [prix, setPrix] = useState(profil.prix_affiches);
  const [mention, setMention] = useState(profil.prix_mention || '');
  const a = useAction();
  useEffect(() => { setTelephone(profil.telephone || ''); setPrix(profil.prix_affiches); setMention(profil.prix_mention || ''); }, [profil]);

  const chiffres = telephone.replace(/\D/g, '');
  const telValide = chiffres === '' || /^0[1-9][0-9]{8}$/.test(chiffres);

  return (
    <form className="carte" onSubmit={async (e) => {
      e.preventDefault();
      if (!telValide) return;
      if (await a.lancer(() => donnees.enregistrerProfil({ telephone: chiffres || null, prix_affiches: prix, prix_mention: mention.trim() || null }), 'Enregistré. Le site sera mis à jour.')) apres();
    }}>
      <h2>Ce que le site affiche</h2>
      <label htmlFor="tel">Téléphone affiché sur le site</label>
      <p className="aide" id="aide-tel">Dix chiffres. C’est le numéro du bouton « Appeler ».</p>
      <input id="tel" type="tel" inputMode="tel" autoComplete="tel" aria-describedby="aide-tel erreur-tel" aria-invalid={!telValide}
        value={telephone} onChange={(e) => setTelephone(e.target.value)} />
      {!telValide && <p className="erreur" id="erreur-tel">Numéro invalide : dix chiffres, commençant par 0 (par exemple 06 12 34 56 78).</p>}

      <div className="case-a-cocher">
        <input id="prix" type="checkbox" checked={prix} onChange={(e) => setPrix(e.target.checked)} />
        <label htmlFor="prix">Afficher mes prix sur le site</label>
      </div>
      {prix && (
        <>
          <label htmlFor="mention">Phrase sous les prix (facultatif)</label>
          <p className="aide" id="aide-mention">Par exemple : « Prix indicatifs TTC, devis gratuit sur place. »</p>
          <textarea id="mention" maxLength={280} rows={2} aria-describedby="aide-mention" value={mention} onChange={(e) => setMention(e.target.value)} />
        </>
      )}
      <Message erreur={a.erreur} fait={a.fait} />
      <button className="bouton" disabled={a.occupe || !telValide}>{a.occupe ? 'Enregistrement…' : 'Enregistrer'}</button>
    </form>
  );
}

const nombre = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.').replace(/\s/g, '')));

function LigneTarif({ tarif, rang = 0, apres }: { tarif?: Tarif; rang?: number; apres: () => void }) {
  const { donnees } = useApp();
  const [ouvert, setOuvert] = useState(false);
  const [poste, setPoste] = useState(tarif?.poste || '');
  const [bas, setBas] = useState(tarif ? String(tarif.bas) : '');
  const [haut, setHaut] = useState(tarif?.haut != null ? String(tarif.haut) : '');
  const [unite, setUnite] = useState(tarif?.unite || 'm²');
  const a = useAction();

  if (tarif && !ouvert) return (
    <div className="carte tarif">
      <p><strong>{tarif.poste}</strong><br />{euros(tarif.bas)}{tarif.haut != null ? ` à ${euros(tarif.haut)}` : ''} / {tarif.unite}</p>
      <div className="actions">
        <button className="bouton secondaire" onClick={() => setOuvert(true)}>Modifier</button>
        <button className="bouton secondaire" disabled={a.occupe} onClick={async () => { if (await a.lancer(() => donnees.supprimerTarif(tarif.id))) apres(); }}>Retirer</button>
      </div>
      <Message erreur={a.erreur} />
    </div>
  );
  if (!tarif && !ouvert) return <button className="bouton secondaire" onClick={() => setOuvert(true)}>Ajouter un tarif</button>;

  const b = nombre(bas), h = nombre(haut);
  const probleme = b == null || isNaN(b) || b < 0 ? 'Indiquez un prix.' : h != null && (isNaN(h) || h < b) ? 'Le prix haut doit être supérieur ou égal au prix bas.' : null;
  const p = tarif?.id || 'nouveau';

  return (
    <form className="carte" onSubmit={async (e) => {
      e.preventDefault();
      if (probleme) return;
      const ok = await a.lancer(() => donnees.enregistrerTarif({ id: tarif?.id, poste: poste.trim(), bas: b!, haut: h, unite: unite.trim(), note: tarif?.note ?? null, rang: tarif?.rang ?? rang }));
      if (ok) { setOuvert(false); if (!tarif) { setPoste(''); setBas(''); setHaut(''); } apres(); }
    }}>
      <label htmlFor={`poste-${p}`}>Prestation</label>
      <input id={`poste-${p}`} required maxLength={120} value={poste} onChange={(e) => setPoste(e.target.value)} />
      <div className="rang-3">
        <div><label htmlFor={`bas-${p}`}>De (€)</label><input id={`bas-${p}`} inputMode="decimal" required value={bas} onChange={(e) => setBas(e.target.value)} /></div>
        <div><label htmlFor={`haut-${p}`}>À (€, facultatif)</label><input id={`haut-${p}`} inputMode="decimal" value={haut} onChange={(e) => setHaut(e.target.value)} /></div>
        <div><label htmlFor={`unite-${p}`}>Par</label><input id={`unite-${p}`} required maxLength={24} list="unites" value={unite} onChange={(e) => setUnite(e.target.value)} /></div>
      </div>
      <datalist id="unites"><option value="m²" /><option value="ml" /><option value="unité" /><option value="heure" /><option value="jour" /><option value="forfait" /></datalist>
      {(bas || haut) && probleme && <p className="erreur">{probleme}</p>}
      <Message erreur={a.erreur} />
      <div className="actions">
        <button className="bouton" disabled={a.occupe || !!probleme}>Enregistrer</button>
        <button type="button" className="bouton secondaire" onClick={() => setOuvert(false)}>Annuler</button>
      </div>
    </form>
  );
}
