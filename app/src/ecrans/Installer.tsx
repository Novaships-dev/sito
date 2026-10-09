// Installer l'app. Décision du 5 octobre : sur le Play Store pour Android ;
// pour l'iPhone, ajoutée à l'écran d'accueil depuis le site Sitô.
import { useEffect, useState } from 'react';
import { Ecran } from '../ui';

type InviteInstallation = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let invite: InviteInstallation | null = null;
const abonnes = new Set<() => void>();
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invite = e as InviteInstallation; abonnes.forEach((f) => f()); });
addEventListener('appinstalled', () => { invite = null; abonnes.forEach((f) => f()); });

export const estInstallee = () => matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

function appareil(): 'iphone' | 'android' | 'ordinateur' {
  const ua = navigator.userAgent;
  // iPadOS se présente comme un Mac : on le reconnaît à l'écran tactile.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iphone';
  if (/Android/.test(ua)) return 'android';
  return 'ordinateur';
}

export function Installer() {
  const [, rafraichir] = useState(0);
  useEffect(() => { const f = () => rafraichir((n) => n + 1); abonnes.add(f); return () => { abonnes.delete(f); }; }, []);
  const quoi = appareil();

  if (estInstallee()) return <Ecran titre="Installer l’app"><p className="carte">L’app est déjà installée sur cet appareil.</p></Ecran>;

  return (
    <Ecran titre="Installer l’app" retour={{ lien: '#/', texte: 'Retour' }}>
      <p>Une fois installée, Sitô s’ouvre depuis l’écran d’accueil, en plein écran, comme une app.</p>

      {quoi === 'iphone' && (
        <section className="carte" aria-labelledby="t-iphone">
          <h2 id="t-iphone">Sur iPhone ou iPad</h2>
          <ol className="etapes">
            <li>Ouvrez cette page dans <strong>Safari</strong>.</li>
            <li>Touchez le bouton <strong>Partager</strong> <span aria-hidden="true">(le carré avec une flèche vers le haut)</span>.</li>
            <li>Choisissez <strong>Sur l’écran d’accueil</strong>, puis <strong>Ajouter</strong>.</li>
          </ol>
          <p className="aide">Si vous ne voyez pas « Sur l’écran d’accueil », faites défiler la liste vers le bas.</p>
        </section>
      )}

      {quoi !== 'iphone' && (
        <section className="carte" aria-labelledby="t-autre">
          <h2 id="t-autre">{quoi === 'android' ? 'Sur Android' : 'Sur cet ordinateur'}</h2>
          {invite ? (
            <button className="bouton" onClick={async () => { const i = invite; if (!i) return; await i.prompt(); await i.userChoice; invite = null; rafraichir((n) => n + 1); }}>Installer Sitô</button>
          ) : (
            <p>Ouvrez le menu du navigateur (⋮), puis <strong>{quoi === 'android' ? 'Ajouter à l’écran d’accueil' : 'Installer Sitô'}</strong>.</p>
          )}
          {quoi === 'android' && <p className="aide">L’app sera aussi sur le Play Store.</p>}
        </section>
      )}
    </Ecran>
  );
}
