// The brand's public profiles. The footer links to them and the Organization
// schema in Layout.astro declares them as `sameAs`, so the two can't drift
// apart the way a second hardcoded copy would.
export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/profile.php?id=100075696167966',
  instagram: 'https://www.instagram.com/literiebleunuitbruay/',
} as const;
