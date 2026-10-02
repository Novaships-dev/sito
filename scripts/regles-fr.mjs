// Règles supplémentaires pour kill-ai-slop.
// Usage : npx kill-ai-slop <chemin> --rules=scripts/regles-fr.mjs

export default [
  { id: 'fr-police-defaut', severity: 'error',
    description: 'Police par defaut du modele',
    // Contexte de declaration seulement : sinon "Inter" matche "Interventions".
    pattern: /(font-family|family=|fontFamily)[^;>"']{0,80}\b(Inter|Geist|Space Grotesk|Poppins|Montserrat|Fraunces|Instrument[_ ]Serif)\b/,
    files: /\.(css|html|astro|jsx|tsx|liquid)$/,
    fix: 'Archivo, Public Sans, Libre Franklin, Bricolage Grotesque' },

  { id: 'fr-palette-artisan', severity: 'error',
    description: 'Palette beige laiton espresso, signature la plus repandue sur brief artisan',
    pattern: /#(f5f1ea|f7f5f1|fbf8f1|efeae0|ece6db|faf7f1|e8dfcb|f4f1ea|d97757|b08947|b6553a|9c6e2a|bc7c3a|7d5621)/i,
    files: /\.(css|html|astro|jsx|tsx|liquid)$/,
    fix: 'voir skills/_partage/references/palettes.md, sept familles de rotation' },

  { id: 'fr-noir-teinte', severity: 'warning',
    description: 'Noir teinte a la place du noir',
    pattern: /#(0b0b0b|111111|0a0a0a|121212)\b/i,
    files: /\.(css|html|astro|jsx|tsx|liquid)$/,
    fix: 'une couleur sombre choisie pour le projet' },

  { id: 'fr-icones', severity: 'warning',
    description: 'Bibliotheque d icones par defaut',
    pattern: /(lucide-react|@heroicons)/,
    files: /\.(js|jsx|ts|tsx|json)$/,
    fix: 'Phosphor, HugeIcons, Radix ou Tabler, une seule famille' },

  { id: 'fr-scroll-listener', severity: 'error',
    description: 'Ecoute directe du scroll',
    pattern: /addEventListener\s*\(\s*['"]scroll['"]/,
    files: /\.(js|jsx|ts|tsx|astro)$/,
    fix: 'IntersectionObserver' },

  { id: 'fr-hauteur-ecran', severity: 'error',
    description: 'h-screen ou 100vh casse la mise en page mobile',
    pattern: /(h-screen|height:\s*100vh)/,
    files: /\.(css|html|astro|jsx|tsx|liquid)$/,
    fix: 'min-height: 100dvh' },

  { id: 'fr-emoji-titre', severity: 'error',
    description: 'Emoji dans un titre',
    pattern: /<h[1-4][^>]*>[^<]*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
    files: /\.(html|astro|jsx|tsx|liquid)$/,
    fix: 'retirer' },

  { id: 'fr-eyebrow-capitales', severity: 'warning',
    description: 'Intitule en capitales espacees au-dessus d un titre',
    pattern: /class="[^"]*(uppercase[^"]*tracking|tracking[^"]*uppercase)/,
    files: /\.(html|astro|jsx|tsx|liquid)$/,
    fix: 'plafond : nombre de sections divise par trois' },
];
