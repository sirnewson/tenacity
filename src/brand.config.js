/* ============================================================================
 *  TENACITY LOCKS — CLIENT BUILD
 *  ---------------------------------------------------------------------------
 *  Migrated onto the YXM master build. Only this file and public/brand/tenacity/
 *  belong to the client — everything else is master code and is replaced by
 *      python tools/new-client.py update "tenacity Locks"
 * ========================================================================== */
const brand = {
  // ---------------------------------------------------------------- identity
  slug: 'tenacity',
  clientName: 'Tenacity Locks',
  appTitle: 'Tenacity Creator Studio',
  headline: 'Tenacity',
  headlineSuffix: 'Locks',
  subhead: 'Pick a template and shoot your post.',
  favicon: '🔒',

  assetDir: '/brand/tenacity',
  logo: 'logo.png',
  // The YXM mark is a full-colour gradient — never flatten it.
  logoTint: 'none',
  // Its yellow arm would vanish on the yellow surface, so it sits on a dark chip.

  // 'light' = YXM yellow surface with black type. 'dark' = the original studio.
  theme: 'dark',

  // 'rainbow' is the YXM gradient pill; 'brand' uses the accent gradient.
  ctaStyle: 'brand',

  // Demo-only features. Turn both off for a real client build.
  demoMode: false,
  allowOverlayUpload: false,

  // ------------------------------------------------------------------ colors
  // The accent that headlines, icons and buttons pick up. Near-black is the
  // YXM look on yellow; the swatches below let a visitor try their own.
  colors: {
    300: '#d946ef',
    400: '#c026d3',
    500: '#a21caf',
    600: '#86198f',
  },

  // Swatches offered by the palette switcher. All four shades above are
  // re-derived from whichever hex is picked.
  palettes: [
    { name: 'YXM Black', hex: '#18181B' },
    { name: 'Violet', hex: '#7C3AED' },
    { name: 'Blue', hex: '#2563EB' },
    { name: 'Magenta', hex: '#DB2777' },
    { name: 'Teal', hex: '#0D9488' },
    { name: 'Orange', hex: '#EA580C' },
  ],

  currency: 'KSH',

  // --------------------------------------------------------------- templates
  templates: [
    {
      id: 'reel',
      name: 'Reel / Story',
      sub: '9:16 Vertical',
      file: 'reel-overlay.png',
      size: '9:16',
      icon: 'fa-mobile-screen',
      iconColor: 'text-purple-300',
    },
    {
      id: 'footer-stripe',
      name: 'Footer Stripe',
      sub: 'Clean Footer',
      file: 'footer-stripe.png',
      size: '4:5',
      icon: 'fa-window-minimize',
      iconColor: 'text-purple-400',
    },
    {
      id: 'logo-number',
      name: 'Logo + Number',
      sub: 'Contact Header',
      file: 'logo-number.png',
      size: '4:5',
      icon: 'fa-address-card',
      iconColor: 'text-white',
    },
    {
      id: 'side-stripes',
      name: 'Side Stripes',
      sub: 'Edgy Look',
      file: 'side-stripes.png',
      size: '4:5',
      icon: 'fa-grip-lines-vertical',
      iconColor: 'text-purple-300',
    },
    {
      id: 'with-lock',
      name: 'With Lock',
      sub: 'Product Focus',
      file: 'with-lock.png',
      size: '4:5',
      icon: 'fa-lock',
      iconColor: 'text-orange-400',
    },
    {
      id: 'product-overlay',
      name: 'Product Overlay',
      sub: 'Bold Product Frame',
      file: 'product-overlay.png',
      size: '4:5',
      icon: 'fa-tags',
      iconColor: 'text-yellow-300',
    }
  ],

  // ------------------------------------------------------------- price tags
  tagStyles: [
    { id: 'tenacity', name: 'Tenacity', icon: 'fa-lock', file: 'product-tag-overlay.png' }
  ],
  defaultTagStyle: 'tenacity',

  /* Where the text sits on the plate. These defaults suit the generated plates
     in public/brand/<slug>/tag-*.png, which are flat. A client whose designer
     supplies a plate with a painted panel (Tenacity's gold price block, say)
     overrides only the keys that differ — everything omitted falls back to the
     master default in src/tagLayout.js.

     Positions are fractions of the plate's width/height; type sizes are
     fractions of its WIDTH, so the text tracks the plate as it scales. */
  /* Overrides for this client's plate artwork. Anything omitted falls back
     to the master default in src/tagLayout.js. */
  tag: {
    textLeft: 0.1,
    textWidth: 0.36,
    textTop: 0.175,
    textHeight: 0.62,
    titleTop: 0.2,
    detailTop: 0.45,
    priceBoxLeft: 0.53,
    priceBoxTop: 0.163,
    priceBoxWidth: 0.329,
    priceBoxHeight: 0.643,
    panelLeft: 0.53,
    priceRight: 0.845,
    priceMid: 0.52,
  },

  tagFields: {
    title: 'Add Price Tag',
    nameLabel: 'Product name',
    namePlaceholder: 'e.g. Union 5-Lever Lock',
    detailsLabel: 'Details (one per line)',
    detailsPlaceholder: 'e.g. Hardened steel\n2 year warranty',
    priceLabel: 'Price',
    pricePlaceholder: 'e.g. 5,000/=',
  },



  // ------------------------------------------------------------------ suite
  // The all-in-one hub. `native` runs in this app; `embed` loads a bundled
  // single-file app from public/apps/<id>/ in a full-screen frame, so each one
  // stays independently updatable — drop in a new index.html and it is live.
  suite: {
    enabled: true,
    kicker: 'Where the shop, the team and the marketing tools work together',
    title: 'Tenacity Studio',
    intro:
      'One workspace for the client, the creative team and the brand. Create the work, talk about it and approve it in the same place — on the phone your team already carries.',
    facts: [
      { icon: 'fa-mobile-screen-button', label: 'Works in any phone browser' },
      { icon: 'fa-shield-halved', label: 'Your photos and files never leave the device' },
      { icon: 'fa-palette', label: 'Re-skins to your brand in minutes' },
    ],
  },

  apps: [
    {
      id: 'poster',
      group: 'Create',
      kind: 'native',
      name: 'Poster Studio',
      tagline: 'Shoot a product, drop your branding on it, export a ready-to-post image.',
      icon: 'fa-camera-retro',
      tint: '#0EA5E9',
      badge: 'Core',
    },
    {
      id: 'video',
      kind: 'native',
      screen: 'video',
      group: 'Create',
      name: 'Video Studio',
      tagline: 'Bring in a clip, trim it, and the same branding goes on every frame — rendered at full quality.',
      icon: 'fa-clapperboard',
      tint: '#F43F5E',
      badge: 'New',
    },
    {
      id: 'qr',
      group: 'Create',
      kind: 'embed',
      url: '/apps/qr/index.html',
      name: 'QR Studio',
      tagline: 'Make branded QR codes — WhatsApp, wifi, vCard, links — and scan them back with the camera.',
      icon: 'fa-qrcode',
      tint: '#8B5CF6',
    },
    {
      id: 'captions',
      group: 'Create',
      kind: 'embed',
      url: '/apps/captions/index.html',
      name: 'Caption Writer',
      tagline: 'Turn a rough idea into a finished caption with hashtags, in the tone you pick.',
      icon: 'fa-pen-nib',
      tint: '#EC4899',
      badge: 'AI',
    },
    {
      id: 'room',
      kind: 'native',
      screen: 'room',
      group: 'Work together',
      name: 'Client Room',
      tagline: 'Chat, files and approvals in one thread — and the room turns what is said into work.',
      icon: 'fa-comments',
      tint: '#6366F1',
      badge: 'New',
    },
    {
      id: 'tasks',
      kind: 'native',
      screen: 'tasks',
      group: 'Work together',
      name: 'Task Board',
      tagline: 'Every job the rooms created, with who it is for and when it is due.',
      icon: 'fa-list-check',
      tint: '#0891B2',
    },
    {
      id: 'assets',
      kind: 'native',
      screen: 'soon',
      group: 'Coming next',
      name: 'Asset Library',
      tagline: 'Logos, product photos, fonts and every poster you have already made.',
      icon: 'fa-folder-open',
      tint: '#7C3AED',
      badge: 'Soon',
    },
    {
      id: 'catalogue',
      kind: 'native',
      screen: 'soon',
      group: 'Coming next',
      name: 'Product Catalogue',
      tagline: 'Products, prices and descriptions — shareable as a page a customer can browse.',
      icon: 'fa-tags',
      tint: '#059669',
      badge: 'Soon',
    },
    {
      id: 'planner',
      kind: 'native',
      screen: 'soon',
      group: 'Coming next',
      name: 'Content Planner',
      tagline: 'The campaign calendar: what goes out, and when.',
      icon: 'fa-calendar-week',
      tint: '#D97706',
      badge: 'Soon',
    },
    {
      id: 'notes',
      group: 'Organise',
      kind: 'native',
      screen: 'notes',
      name: 'Notes',
      tagline: 'Catch the idea when it happens — the shot list, the offer, the line you thought of.',
      icon: 'fa-lightbulb',
      tint: '#10B981',
    },
    {
      id: 'memory',
      group: 'Organise',
      kind: 'native',
      screen: 'memory',
      name: 'Brand Memory',
      tagline: 'Who you are, how you sound, what you sell — the context every tool writes from.',
      icon: 'fa-brain',
      tint: '#14B8A6',
    },
    {
      id: 'generate',
      group: 'Coming next',
      kind: 'native',
      screen: 'soon',
      name: 'Generate Content',
      tagline: 'Describe the offer; get the image, the video and the caption built around your brand.',
      icon: 'fa-wand-magic-sparkles',
      tint: '#F43F5E',
      badge: 'Soon',
    },
    {
      id: 'quoty',
      group: 'Create',
      kind: 'embed',
      url: '/apps/quoty/index.html',
      name: 'Quoty',
      tagline: 'Put a quote, lyric or line of copy over an image and style it into a shareable card.',
      icon: 'fa-quote-left',
      tint: '#F59E0B',
    },
  ],

  // ------------------------------------------------------------- scan badge
  // A QR burned into the poster. Presets so nobody types a URL on a phone.
  qr: {
    enabled: true,
    title: 'Add a scan code',
    caption: 'SCAN TO ORDER',
    presets: [
      {
        id: 'whatsapp',
        label: 'WhatsApp us',
        icon: 'fa-whatsapp',
        value: 'https://wa.me/254700000000?text=Hi%2C%20I%20saw%20your%20post',
        caption: 'SCAN TO ORDER',
      },
      {
        id: 'site',
        label: 'Our website',
        icon: 'fa-globe',
        value: 'https://yourbrand.co.ke',
        caption: 'SCAN TO SHOP',
      },
      {
        id: 'maps',
        label: 'Find our store',
        icon: 'fa-location-dot',
        value: 'https://maps.google.com/?q=Nairobi',
        caption: 'FIND US',
      },
    ],
  },

  // ------------------------------------------------------------- captions
  // Composed from the tag the user already filled in. {product} {price}
  // {detail} {brand} are substituted; "Another" reshuffles.
  captions: {
    openers: [
      '{product} — now {price}.',
      'Just in: {product}. {price}.',
      '{product}. {price}. Simple as that.',
      'Say hello to {product} at {price}.',
    ],
    bodies: [
      '{detail}',
      'In store now while stock lasts.',
      'Ask our team to show you.',
    ],
    ctas: [
      'Scan the code on the post to order.',
      'Send us a DM to reserve yours.',
      'Tag someone who needs this.',
    ],
    hashtags: ['#Nairobi', '#Kenya', '#ShopLocal', '#NewArrival', '#Offer'],
  },

  // ---------------------------------------------------- homepage walkthrough
  guide: {
    kicker: 'Branded posts in about 30 seconds',
    title: 'How it works',
    intro:
      'Your team shoots a photo on their phone. The app drops your branding on top and exports a ready-to-post image. No designer, no waiting, nothing to learn.',
    steps: [
      {
        icon: 'fa-table-cells-large',
        title: 'Pick a template',
        body:
          'Your designer supplies the overlays once — a footer bar, a frame, a story layout. They appear here as cards. You can also upload one now to try it.',
      },
      {
        icon: 'fa-camera',
        title: 'Shoot or upload a photo',
        body:
          'The viewfinder is locked to the exact export shape, with the overlay ghosted on top so nothing important lands under the branding. Drag and zoom to frame it.',
      },
      {
        icon: 'fa-tags',
        title: 'Add a price tag (optional)',
        body:
          'Type a name, a couple of detail lines and a price. Drag the tag anywhere, resize it from the corners, and pick a plate style.',
      },
      {
        icon: 'fa-layer-group',
        title: 'Doing a whole run?',
        body:
          'Turn on Batch in the studio. Every capture stacks up instead of interrupting you — edit the tag, shoot the next one, and export the lot as a single zip when you are done.',
      },
      {
        icon: 'fa-wand-magic-sparkles',
        title: 'Save or share',
        body:
          'The poster renders at full resolution — 1080×1350 for feed, 1080×1920 for stories — then saves to the phone or opens the share sheet straight into WhatsApp or Instagram.',
      },
    ],
    facts: [
      { icon: 'fa-mobile-screen-button', label: 'Works in any phone browser' },
      { icon: 'fa-shield-halved', label: 'Renders on the device — nothing uploaded' },
      { icon: 'fa-palette', label: 'Re-skins to your brand in minutes' },
    ],
    ctaPrimary: 'Try it now',
    ctaSecondary: 'Upload my own overlay',
    paletteLabel: 'See it in your colour',
  },

  // ----------------------------------------------------- overlay upload help
  overlayHelp: {
    title: 'Upload your overlay',
    intro:
      'An overlay is your branding as a transparent PNG, sized to the whole post. Wherever it is transparent, the photo shows through.',
    rules: [
      'PNG with real transparency — a JPG has no see-through areas and will hide the photo.',
      'Full-bleed at the export size: 1080×1350 for a feed post, 1080×1920 for a story.',
      'Keep logo, contact and text inside the outer 8% so phones don’t crop them.',
      'Leave the middle clear — that is where the photo lands.',
    ],
    footnote:
      'Uploaded overlays stay on this device for this session only. Nothing is sent anywhere.',
  },

  socials: [
    {
      href: 'https://wa.me/254711776688',
      icon: 'fa-whatsapp',
      brand: 'fa-brands',
      hover: 'hover:bg-[#25D366] hover:border-transparent',
    },
    {
      href: 'https://instagram.com/tenacitylocks',
      icon: 'fa-instagram',
      brand: 'fa-brands',
      hover: 'hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 hover:border-transparent',
    },
    {
      href: 'https://facebook.com/tenacitylocks',
      icon: 'fa-facebook-f',
      brand: 'fa-brands',
      hover: 'hover:bg-[#1877F2] hover:border-transparent',
    }
  ],

  requestDesign: {
    label: 'Talk to us',
    href: "https://wa.me/254702480771?text=Hi%2C%20I%20tried%20the%20Mock%20creator%20demo%20and%20I'd%20like%20a%20branded%20version",
  },

  share: {
    title: 'Tenacity Creator',
    text: 'Check out my design from Tenacity Creator!',
  },

  credits: [
    { label: 'Sir Newson', href: 'https://sirnewson.com' },
    { label: 'YXM Digital', href: 'https://yxmdigital.com' },
  ],
}

export default brand
