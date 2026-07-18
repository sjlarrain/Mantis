// The three "create" entry points, shared by the desktop New menu and the mobile
// create sheet so they never drift apart.
export const CREATE_ACTIONS = [
  { href: '/meetings/new', label: 'New meeting', hint: 'Log a touchpoint', glyph: '✦' },
  { href: '/people/new', label: 'New contact', hint: 'Add a person', glyph: '❋' },
  { href: '/companies/new', label: 'New company', hint: 'Add a company', glyph: '▢' },
]
