// Catalog content captured from the running Directus instance, embedded so the
// Medusa catalog seed is self-contained. Categories/subcategories/products are
// seeded as native Medusa entities; brands into the cms module. Used by
// src/scripts/seed-catalog.ts.

export const categories = [
  {
    name: "Matelas",
    handle: "matelas",
    description: "Trouvez le matelas parfait pour un sommeil réparateur.",
    icon: "bed",
    rank: 1,
  },
  {
    name: "Sommiers",
    handle: "sommiers",
    description: "Sommiers tapissiers, à lattes ou coffres pour tous les besoins.",
    icon: "layers",
    rank: 2,
  },
  {
    name: "Oreillers & Couettes",
    handle: "oreillers-couettes",
    description: "Complétez votre literie avec oreillers et couettes de qualité.",
    icon: "wind",
    rank: 3,
  },
  {
    name: "Têtes de lit",
    handle: "tetes-de-lit",
    description: "Habillage de tête de lit pour un intérieur élégant.",
    icon: "layout",
    rank: 4,
  },
]

export const subcategories = [
  {
    name: "Matelas à ressorts",
    handle: "matelas-a-ressorts",
    parent_handle: "matelas",
    description: "Ressorts ensachés ou biconiques pour un soutien optimal.",
    rank: 1,
  },
  {
    name: "Matelas en mousse",
    handle: "matelas-en-mousse",
    parent_handle: "matelas",
    description: "Mousse à mémoire de forme, froide ou haute résilience.",
    rank: 2,
  },
  {
    name: "Matelas latex",
    handle: "matelas-latex",
    parent_handle: "matelas",
    description: "Latex naturel ou synthétique pour un confort moelleux.",
    rank: 3,
  },
  {
    name: "Sommiers tapissiers",
    handle: "sommiers-tapissiers",
    parent_handle: "sommiers",
    description: "Sommiers recouverts de tissu pour une élégance sobre.",
    rank: 1,
  },
  {
    name: "Sommiers à lattes",
    handle: "sommiers-a-lattes",
    parent_handle: "sommiers",
    description: "Flexibilité et aération avec des lattes bois ou composite.",
    rank: 2,
  },
]

export const brands = [
  {
    name: "Simmons",
    slug: "simmons",
    description: "Leader mondial du matelas haut de gamme depuis 1870.",
    logo: null,
    website: null,
    rank: 1,
  },
  {
    name: "Treca",
    slug: "treca",
    description: "Manufacture française de literie de luxe depuis 1935.",
    logo: null,
    website: null,
    rank: 2,
  },
  {
    name: "Epéda",
    slug: "epeda",
    description: "Confort à la française avec plus de 70 ans d'expertise.",
    logo: null,
    website: null,
    rank: 3,
  },
  {
    name: "Dunlopillo",
    slug: "dunlopillo",
    description: "Pionnier du latex naturel pour une literie saine et durable.",
    logo: null,
    website: null,
    rank: 4,
  },
]

export type CatalogProduct = {
  title: string
  handle: string
  price: number
  promo_price: number | null
  featured: boolean
  in_stock: boolean
  // Which channel(s) sell this product: online (cart + Stripe), in-store only
  // (devis), or both. Unset defaults to in-store only at seed time.
  sale_channel?: "online" | "in_store" | "both"
  category_handle: string
  subcategory_handle: string | null
  brand: string | null
  description: string
}

export const products: CatalogProduct[] = [
  {
    title: "Tête de lit Stockholm Velours",
    handle: "tete-de-lit-stockholm-velours",
    price: 349,
    promo_price: null,
    featured: false,
    in_stock: true,
    sale_channel: "both",
    category_handle: "tetes-de-lit",
    subcategory_handle: null,
    brand: null,
    description: `<p>La <strong>Tête de lit Stockholm</strong> apporte une touche de sophistication à votre chambre avec son velours côtelé et son matelassage en chevrons. S'adapte aux lits 140, 160 et 180 cm.</p>
<ul>
  <li>Velours côtelé 100% polyester</li>
  <li>Matelassage chevrons</li>
  <li>Coloris : Bleu nuit, Vert sauge, Gris perle</li>
  <li>Pieds en métal noir mat</li>
  <li>Montage mural inclus</li>
</ul>`,
  },
  {
    title: "Simmons Beautyrest Platinum",
    handle: "simmons-beautyrest-platinum",
    price: 1599,
    promo_price: 1299,
    featured: true,
    in_stock: true,
    category_handle: "matelas",
    subcategory_handle: "matelas-a-ressorts",
    brand: "Simmons",
    description: `<p>Le <strong>Simmons Beautyrest Platinum</strong> représente le summum du confort avec sa technologie AirCool® et ses ressorts micro-ensachés de haute précision. Idéal pour les dormeurs exigeants.</p>
<ul>
  <li>Ressorts micro-ensachés 3D (800 ressorts/m²)</li>
  <li>Technologie AirCool® pour une meilleure ventilation</li>
  <li>Couche de gel mémoire de forme</li>
  <li>Hauteur : 30 cm</li>
  <li>Fermeté : Moyen</li>
</ul>`,
  },
  {
    title: "Simmons Beautyrest Classic",
    handle: "simmons-beautyrest-classic",
    price: 799,
    promo_price: null,
    featured: true,
    in_stock: true,
    category_handle: "matelas",
    subcategory_handle: "matelas-a-ressorts",
    brand: "Simmons",
    description: `<p>Le <strong>Simmons Beautyrest Classic</strong> offre un confort équilibré grâce à ses ressorts ensachés indépendants Beautyrest®. Chaque ressort réagit individuellement pour un soutien précis et réduire les perturbations dues aux mouvements du partenaire.</p>
<ul>
  <li>Ressorts ensachés indépendants Beautyrest®</li>
  <li>Garnissage mousse à mémoire de forme</li>
  <li>Tissu Tencel® respirant et doux</li>
  <li>Hauteur : 26 cm</li>
  <li>Fermeté : Moyen ferme</li>
</ul>`,
  },
  {
    title: "Treca Interiors Paris Windsor",
    handle: "treca-interiors-paris-windsor",
    price: 2490,
    promo_price: null,
    featured: true,
    in_stock: true,
    category_handle: "matelas",
    subcategory_handle: "matelas-a-ressorts",
    brand: "Treca",
    description: `<p>Fabriqué à la main dans les ateliers Treca en France, le <strong>Windsor</strong> incarne le luxe à la française. Son architecture en ressorts tonneau biconiques offre un maintien ferme et dynamique, plébiscité par les hôtels palace.</p>
<ul>
  <li>Ressorts biconiques à l'ancienne (300 g/ressort)</li>
  <li>Garnissage coton, laine et soie naturels</li>
  <li>Tissu jacquard damassé exclusif</li>
  <li>Hauteur : 32 cm</li>
  <li>Fermeté : Ferme</li>
  <li>Fabriqué en France</li>
</ul>`,
  },
  {
    title: "Simmons Sommier à Lattes Flex",
    handle: "simmons-sommier-a-lattes-flex",
    price: 369,
    promo_price: null,
    featured: false,
    in_stock: false,
    category_handle: "sommiers",
    subcategory_handle: "sommiers-a-lattes",
    brand: "Simmons",
    description: `<p>Le <strong>Sommier à Lattes Flex</strong> de Simmons combine flexibilité et aération pour prolonger la durée de vie de votre matelas. Ses lattes en bois courbé absorbent les chocs et s'adaptent à votre morphologie.</p>
<ul>
  <li>28 lattes en bois de pin courbé</li>
  <li>Lattes centrales renforcées pour la zone lombaire</li>
  <li>Aération optimale pour le matelas</li>
  <li>Pieds en plastique renforcé réglables</li>
</ul>`,
  },
  {
    title: "Dunlopillo Royal Comfort",
    handle: "dunlopillo-royal-comfort",
    price: 1190,
    promo_price: null,
    featured: false,
    in_stock: true,
    category_handle: "matelas",
    subcategory_handle: "matelas-latex",
    brand: "Dunlopillo",
    description: `<p>Le <strong>Dunlopillo Royal Comfort</strong> est confectionné en latex naturel Talalay, le plus pur et le plus respirant du marché. Un choix idéal pour les allergiques et les personnes sensibles à la chaleur.</p>
<ul>
  <li>Latex naturel Talalay 100% pur</li>
  <li>Traitement anti-acariens et anti-bactérien permanent</li>
  <li>Tissu en fibres de bambou</li>
  <li>Hauteur : 22 cm</li>
  <li>Fermeté : Moyen</li>
</ul>`,
  },
  {
    title: "Epéda Grand Nuage",
    handle: "epeda-grand-nuage",
    price: 649,
    promo_price: null,
    featured: false,
    in_stock: true,
    category_handle: "matelas",
    subcategory_handle: "matelas-en-mousse",
    brand: "Epéda",
    description: `<p>Le <strong>Epéda Grand Nuage</strong> propose un accueil moelleux unique grâce à sa combinaison de mousse à mémoire de forme et de mousse haute résilience. La sensation d'être enveloppé dans un nuage.</p>
<ul>
  <li>Mousse à mémoire de forme 65 kg/m³</li>
  <li>Soutien en mousse haute résilience 35 kg/m³</li>
  <li>Tissu aloe vera apaisant</li>
  <li>Hauteur : 23 cm</li>
  <li>Fermeté : Moelleux</li>
</ul>`,
  },
  {
    title: "Epéda Sommier Tapissier Élite",
    handle: "epeda-sommier-tapissier-elite",
    price: 449,
    promo_price: null,
    featured: false,
    in_stock: true,
    category_handle: "sommiers",
    subcategory_handle: "sommiers-tapissiers",
    brand: "Epéda",
    description: `<p>Le <strong>Sommier Tapissier Élite</strong> offre un galbe parfait et une assise ferme pour optimiser le confort de votre matelas. Sa structure renforcée en bois massif garantit longévité et stabilité.</p>
<ul>
  <li>Structure en bois massif de hêtre</li>
  <li>Revêtement tissu gris anthracite</li>
  <li>Pieds en bois laqué blanc ou wengé</li>
  <li>Disponible en version coffre sur demande</li>
</ul>`,
  },
  {
    title: "Oreiller Mémoire de Forme Premium",
    handle: "oreiller-memoire-de-forme-premium",
    price: 89,
    promo_price: null,
    featured: false,
    in_stock: true,
    sale_channel: "both",
    category_handle: "oreillers-couettes",
    subcategory_handle: null,
    brand: "Epéda",
    description: `<p>L'<strong>Oreiller Mémoire de Forme Premium</strong> épouse parfaitement les contours de votre tête et de votre nuque pour réduire les tensions musculaires et améliorer la qualité de votre sommeil.</p>
<ul>
  <li>Mousse à mémoire de forme 70 kg/m³</li>
  <li>Housse en tissu Tencel® lavable en machine</li>
  <li>Forme anatomique ergonomique</li>
  <li>Traitement anti-acariens</li>
</ul>`,
  },
]
