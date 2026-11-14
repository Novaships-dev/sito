// L'univers 3D de la page : une maison en traits de lumière jaune qui se
// construit, posée sur un plan de chantier vert qui file vers l'horizon, dans
// une poussière dorée. Fixe derrière toute la page : les panneaux de verre le
// floutent. La caméra monte quand on descend la page.
//
// Si le navigateur n'a pas WebGL, ou si le visiteur demande moins d'animation,
// on ne dessine rien d'animé : le fond CSS (dégradé vert) reste, sans erreur.
import { useEffect, useRef } from 'react';
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, FogExp2, GridHelper, LineBasicMaterial,
  LineSegments, PerspectiveCamera, Points, PointsMaterial, Scene, WebGLRenderer,
} from 'three';

function webglDisponible(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// Les arêtes d'une maison : murs, toit à deux pans, cheminée, porte, fenêtres.
// L'ordre compte : la construction les dessine dans cet ordre.
function areteMaison(): Float32Array {
  const L = 2.2, P = 1.6, H = 1.5, F = 2.6; // demi-largeur, demi-profondeur, hauteur des murs, faîtage
  const s: number[] = [];
  const seg = (a: number[], b: number[]) => s.push(...a, ...b);
  const c = [[-L, 0, -P], [L, 0, -P], [L, 0, P], [-L, 0, P]];
  const h = c.map(([x, , z]) => [x, H, z]);
  for (let i = 0; i < 4; i++) seg(c[i], c[(i + 1) % 4]);          // sol
  for (let i = 0; i < 4; i++) seg(c[i], h[i]);                    // poteaux
  for (let i = 0; i < 4; i++) seg(h[i], h[(i + 1) % 4]);          // haut des murs
  const f1 = [-L, F, 0], f2 = [L, F, 0];
  seg(f1, f2);                                                     // faîtage
  seg(h[0], f1); seg(h[3], f1); seg(h[1], f2); seg(h[2], f2);      // pans du toit
  seg([1.1, 2.05, -0.55], [1.1, 2.9, -0.55]); seg([1.5, 2.3, -0.55], [1.5, 2.9, -0.55]); seg([1.1, 2.9, -0.55], [1.5, 2.9, -0.55]); // cheminée
  seg([-0.35, 0, P], [-0.35, 1.0, P]); seg([0.35, 0, P], [0.35, 1.0, P]); seg([-0.35, 1.0, P], [0.35, 1.0, P]); // porte
  for (const x of [-1.5, 0.95]) {                                  // fenêtres
    seg([x, 0.55, P], [x + 0.55, 0.55, P]); seg([x, 1.1, P], [x + 0.55, 1.1, P]);
    seg([x, 0.55, P], [x, 1.1, P]); seg([x + 0.55, 0.55, P], [x + 0.55, 1.1, P]);
    seg([x + 0.275, 0.55, P], [x + 0.275, 1.1, P]);
  }
  return new Float32Array(s);
}

export function Univers() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !webglDisponible()) return;
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rendu: WebGLRenderer;
    try {
      rendu = new WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    cv.classList.add('m-univers--actif');
    rendu.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    const fond = new Color('#06110c');
    rendu.setClearColor(fond, 1);
    const sc = new Scene();
    sc.fog = new FogExp2(fond, 0.045);
    const cam = new PerspectiveCamera(40, 1, 0.1, 200);

    // la maison
    const pos = areteMaison();
    const geoMaison = new BufferGeometry();
    geoMaison.setAttribute('position', new BufferAttribute(pos, 3));
    const maison = new LineSegments(geoMaison, new LineBasicMaterial({ color: '#ffc53d', transparent: true, opacity: 0.95, blending: AdditiveBlending }));
    const halo = new LineSegments(geoMaison, new LineBasicMaterial({ color: '#ffdf8a', transparent: true, opacity: 0.25, blending: AdditiveBlending }));
    halo.scale.setScalar(1.012);
    maison.add(halo);
    maison.position.set(2.6, -1.2, 0);
    sc.add(maison);
    const nbSommets = pos.length / 3;

    // le plan de chantier
    const grille = new GridHelper(160, 120, '#2e7a55', '#163d2b');
    grille.position.y = -1.2;
    (grille.material as LineBasicMaterial).transparent = true;
    (grille.material as LineBasicMaterial).opacity = 0.55;
    sc.add(grille);

    // poussière dorée et étoiles
    function nuage(nb: number, lx: number, ly: number, lz: number, oy: number, taille: number, couleur: string, opa: number) {
      const g = new BufferGeometry(), p = new Float32Array(nb * 3);
      for (let i = 0; i < nb; i++) { p[i * 3] = (Math.random() - 0.5) * lx; p[i * 3 + 1] = Math.random() * ly + oy; p[i * 3 + 2] = -Math.random() * lz + 6; }
      g.setAttribute('position', new BufferAttribute(p, 3));
      return new Points(g, new PointsMaterial({ size: taille, color: couleur, transparent: true, opacity: opa, depthWrite: false, blending: AdditiveBlending }));
    }
    const poussiere = nuage(700, 30, 60, 22, -1, 0.05, '#ffd56b', 0.85);
    const etoiles = nuage(1600, 120, 80, 90, 4, 0.07, '#e9f2ec', 0.6);
    sc.add(poussiere, etoiles);

    const souris = { x: 0, y: 0 }, cible = { x: 0, y: 0 };
    const surPointeur = (e: PointerEvent) => { cible.x = e.clientX / window.innerWidth - 0.5; cible.y = e.clientY / window.innerHeight - 0.5; };
    window.addEventListener('pointermove', surPointeur, { passive: true });
    const taille = () => {
      const w = window.innerWidth, h = window.innerHeight;
      rendu.setSize(w, h, false); cam.aspect = w / h;
      cam.fov = w < 760 ? 58 : 40;
      // sur téléphone, la maison passe derrière le texte, plus haut et plus loin
      maison.position.set(w < 760 ? 0.6 : 2.6, w < 760 ? -0.2 : -1.2, w < 760 ? -3 : 0);
      cam.updateProjectionMatrix();
    };
    window.addEventListener('resize', taille);
    taille();

    let construit = reduit ? 1 : 0, raf = 0, visible = true;
    const debut = performance.now();
    const surVisibilite = () => { visible = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', surVisibilite);

    const image = () => {
      const t = (performance.now() - debut) / 1000;
      souris.x += (cible.x - souris.x) * 0.05; souris.y += (cible.y - souris.y) * 0.05;
      const haut = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const p = window.scrollY / haut;                   // 0 en haut, 1 en bas de page
      const ouverture = Math.min(1, window.scrollY / window.innerHeight);
      if (construit < 1) construit = Math.min(1, t / 2.6);
      const n = Math.floor(nbSommets * (1 - Math.pow(1 - construit, 3)) / 2) * 2;
      geoMaison.setDrawRange(0, n);
      maison.rotation.y = -0.6 + t * 0.12 + souris.x * 0.4;
      cam.position.set(souris.x * 1.2, 1.4 - souris.y * 0.6 + ouverture * 2 + p * 30, 9 - ouverture * 1.5);
      cam.lookAt(souris.x * 0.4, 0.2 + ouverture * 0.6 + p * 30, 0);
      poussiere.rotation.y = t * 0.03; poussiere.position.y = Math.sin(t * 0.4) * 0.2;
      etoiles.rotation.y = t * 0.004;
      rendu.render(sc, cam);
    };
    const boucle = () => { raf = requestAnimationFrame(boucle); if (visible) image(); };
    if (reduit) { image(); window.addEventListener('scroll', image, { passive: true }); }
    else boucle();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', surPointeur);
      window.removeEventListener('resize', taille);
      window.removeEventListener('scroll', image);
      document.removeEventListener('visibilitychange', surVisibilite);
      geoMaison.dispose(); grille.geometry.dispose(); poussiere.geometry.dispose(); etoiles.geometry.dispose();
      rendu.dispose();
    };
  }, []);

  return <canvas ref={ref} className="m-univers" aria-hidden="true" />;
}
