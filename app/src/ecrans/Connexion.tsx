// Connexion par code reçu par e-mail : pas de mot de passe à retenir sur un chantier.
import { useState } from 'react';
import { useApp, useAction, Message } from '../ui';

export function Connexion() {
  const { donnees } = useApp();
  const [courriel, setCourriel] = useState('');
  const [code, setCode] = useState('');
  const [etape, setEtape] = useState<'courriel' | 'code'>('courriel');
  const a = useAction();

  return (
    <main className="connexion" id="contenu" tabIndex={-1}>
      <img src="icone.svg" alt="" width="72" height="72" />
      <h1>Sitô</h1>
      <p className="discret">Votre site, vos chantiers, vos demandes et vos avis.</p>
      {donnees.demo && <p className="bandeau-demo">Démonstration : aucune donnée réelle. Le code est 123456.</p>}

      {etape === 'courriel' ? (
        <form onSubmit={async (e) => { e.preventDefault(); if (await a.lancer(() => donnees.envoyerCode(courriel.trim()))) setEtape('code'); }}>
          <label htmlFor="courriel">Votre adresse e-mail</label>
          <p className="aide" id="aide-courriel">Celle donnée à l’inscription. Vous recevrez un code.</p>
          <input id="courriel" type="email" inputMode="email" autoComplete="email" required aria-describedby="aide-courriel"
            value={courriel} onChange={(e) => setCourriel(e.target.value)} />
          <Message erreur={a.erreur} />
          <button className="bouton" disabled={a.occupe}>{a.occupe ? 'Envoi…' : 'Recevoir mon code'}</button>
        </form>
      ) : (
        <form onSubmit={async (e) => { e.preventDefault(); await a.lancer(() => donnees.verifierCode(courriel.trim(), code.trim())); }}>
          <label htmlFor="code">Code reçu par e-mail</label>
          <p className="aide" id="aide-code">Envoyé à {courriel}. Regardez aussi dans les indésirables.</p>
          <input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" maxLength={8} required aria-describedby="aide-code"
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <Message erreur={a.erreur} />
          <button className="bouton" disabled={a.occupe}>{a.occupe ? 'Vérification…' : 'Me connecter'}</button>
          <button type="button" className="lien" onClick={() => { setEtape('courriel'); setCode(''); a.effacer(); }}>Changer d’adresse ou renvoyer un code</button>
        </form>
      )}
      <p className="pied"><a href="#/installer">Installer l’app sur mon téléphone</a></p>
    </main>
  );
}
