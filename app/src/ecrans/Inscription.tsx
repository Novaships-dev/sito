// Ce qu'ouvre le lien que Sitô envoie par SMS : #/inscription/<jeton> crée le
// compte de l'artisan (rattaché à son entreprise par le lien), #/reprise/<jeton>
// fait choisir un nouveau mot de passe. Une fois, sans code ni e-mail.
import { useEffect, useState } from 'react';
import { useApp, useAction, Message } from '../ui';
import { MOT_DE_PASSE_MIN, type LienCompte } from '../types';

export function Inscription({ jeton }: { jeton: string }) {
  const { donnees } = useApp();
  const [lien, setLien] = useState<LienCompte | null>(null);
  const [refus, setRefus] = useState<string | null>(null);
  const [courriel, setCourriel] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [voir, setVoir] = useState(false);
  const a = useAction();

  useEffect(() => {
    let vivant = true;
    donnees.lireLien(jeton).then((l) => { if (vivant) setLien(l); }, (e: Error) => { if (vivant) setRefus(e.message); });
    return () => { vivant = false; };
  }, [donnees, jeton]);

  if (refus) {
    return (
      <main className="connexion" id="contenu" tabIndex={-1}>
        <h1>Lien refusé</h1>
        <p role="alert">{refus}</p>
        <a className="bouton" href="#/">Aller à la connexion</a>
      </main>
    );
  }
  if (!lien) return <main className="connexion" id="contenu" tabIndex={-1}><p className="discret">Lecture du lien…</p></main>;

  const reprise = lien.genre === 'reprise';
  const envoyer = () => (reprise ? donnees.reprendre(jeton, motDePasse) : donnees.sInscrire(jeton, courriel, motDePasse));
  return (
    <main className="connexion" id="contenu" tabIndex={-1}>
      <img src="icone.svg" alt="" width="72" height="72" />
      <h1>{reprise ? 'Nouveau mot de passe' : 'Créer votre compte'}</h1>
      <p className="discret">{lien.entreprise}</p>
      <form onSubmit={async (e) => { e.preventDefault(); if (await a.lancer(envoyer)) location.hash = '#/'; }}>
        {reprise ? (
          <p className="aide">Compte : {lien.courriel}</p>
        ) : (
          <>
            <label htmlFor="courriel">Votre adresse e-mail</label>
            <p className="aide" id="aide-courriel">Elle servira à vous connecter. Aucun e-mail ne vous sera envoyé pour la confirmer.</p>
            <input id="courriel" type="email" inputMode="email" autoComplete="username" required aria-describedby="aide-courriel"
              value={courriel} onChange={(e) => setCourriel(e.target.value)} />
          </>
        )}
        <label htmlFor="mot-de-passe">{reprise ? 'Nouveau mot de passe' : 'Choisissez un mot de passe'}</label>
        <p className="aide" id="aide-mdp">Au moins {MOT_DE_PASSE_MIN} caractères. Votre téléphone peut le retenir pour vous.</p>
        <input id="mot-de-passe" type={voir ? 'text' : 'password'} autoComplete="new-password" required minLength={MOT_DE_PASSE_MIN} maxLength={72}
          aria-describedby="aide-mdp" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        <div className="case-a-cocher">
          <input id="voir-mdp" type="checkbox" checked={voir} onChange={(e) => setVoir(e.target.checked)} />
          <label htmlFor="voir-mdp">Afficher le mot de passe</label>
        </div>
        <Message erreur={a.erreur} />
        <button className="bouton" disabled={a.occupe}>{a.occupe ? 'Enregistrement…' : reprise ? 'Enregistrer et me connecter' : 'Créer mon compte'}</button>
      </form>
    </main>
  );
}
