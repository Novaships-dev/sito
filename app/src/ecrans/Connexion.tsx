// Connexion par e-mail et mot de passe (décision du 29 octobre 2026 : on
// s'inscrit une fois, c'est fini). Le compte se crée par le lien que Sitô
// envoie par SMS (Inscription.tsx) ; la session reste ouverte sur le téléphone.
import { useState } from 'react';
import { useApp, useAction, Message } from '../ui';
import { COMPTE_DEMO } from '../donnees/demo';

export function Connexion() {
  const { donnees } = useApp();
  const [courriel, setCourriel] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [voir, setVoir] = useState(false);
  const [oubli, setOubli] = useState(false);
  const a = useAction();

  return (
    <main className="connexion" id="contenu" tabIndex={-1}>
      <img src="icone.svg" alt="" width="72" height="72" />
      <h1>Sitô</h1>
      <p className="discret">Votre site, vos chantiers, vos demandes et vos avis.</p>
      {donnees.demo && <p className="bandeau-demo">Démonstration : aucune donnée réelle. Adresse {COMPTE_DEMO.courriel}, mot de passe {COMPTE_DEMO.motDePasse}.</p>}

      <form onSubmit={async (e) => { e.preventDefault(); await a.lancer(() => donnees.seConnecter(courriel, motDePasse)); }}>
        <label htmlFor="courriel">Votre adresse e-mail</label>
        <input id="courriel" type="email" inputMode="email" autoComplete="username" required
          value={courriel} onChange={(e) => setCourriel(e.target.value)} />
        <label htmlFor="mot-de-passe">Votre mot de passe</label>
        <input id="mot-de-passe" type={voir ? 'text' : 'password'} autoComplete="current-password" required
          value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        <div className="case-a-cocher">
          <input id="voir-mdp" type="checkbox" checked={voir} onChange={(e) => setVoir(e.target.checked)} />
          <label htmlFor="voir-mdp">Afficher le mot de passe</label>
        </div>
        <Message erreur={a.erreur} />
        <button className="bouton" disabled={a.occupe}>{a.occupe ? 'Connexion…' : 'Me connecter'}</button>
      </form>
      <button type="button" className="lien" aria-expanded={oubli} onClick={() => setOubli(!oubli)}>Mot de passe oublié ?</button>
      {oubli && (
        <p className="aide">Demandez à Sitô un nouveau lien : vous le recevez par SMS, il vous fait choisir un nouveau mot de passe. Vos chantiers et votre site ne bougent pas.</p>
      )}
      <p className="aide">Pas encore de compte ? Ouvrez le lien d’inscription que Sitô vous a envoyé par SMS.</p>
      <p className="pied"><a href="#/installer">Installer l’app sur mon téléphone</a></p>
    </main>
  );
}
