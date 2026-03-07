type ArcadeIconName =
  | 'arrow-right'
  | 'ball'
  | 'book'
  | 'bolt'
  | 'brain'
  | 'castle'
  | 'check'
  | 'chevron-down'
  | 'clover'
  | 'coin'
  | 'copy'
  | 'crown'
  | 'culture'
  | 'desert'
  | 'dice'
  | 'dna'
  | 'fire'
  | 'fireworks'
  | 'flag'
  | 'galaxy'
  | 'globe'
  | 'handshake'
  | 'heart'
  | 'history'
  | 'language'
  | 'leaf'
  | 'link'
  | 'map'
  | 'math'
  | 'medal'
  | 'moon'
  | 'music'
  | 'palm'
  | 'paw'
  | 'planet'
  | 'puzzle'
  | 'rainbow'
  | 'robot'
  | 'science'
  | 'settings'
  | 'snowflake'
  | 'sound'
  | 'sparkle'
  | 'star'
  | 'store'
  | 'target'
  | 'tech'
  | 'timer'
  | 'token-blue'
  | 'token-green'
  | 'token-red'
  | 'token-yellow'
  | 'user'
  | 'users'
  | 'volcano'
  | 'wallet'
  | 'wand'

type ArcadeIconProps = {
  className?: string
  name: ArcadeIconName
}

const baseClassName = 'inline-block h-6 w-6 shrink-0'

const tokenIcon = (fill: string, shine: string) => (
  <>
    <circle cx="12" cy="12" r="8" fill={fill} stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 8.5C9 7.3 10.7 6.5 12.7 6.5" opacity="0.45" stroke={shine} strokeLinecap="round" strokeWidth="2.2" />
    <circle cx="9" cy="9" r="1.1" fill={shine} opacity="0.7" />
  </>
)

export function ArcadeIcon({ className, name }: ArcadeIconProps) {
  const classes = className ? `${baseClassName} ${className}` : baseClassName

  return (
    <svg aria-hidden="true" className={classes} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      {name === 'arrow-right' ? <path d="M5 12h12m-4-4 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" /> : null}
      {name === 'ball' ? <><circle cx="12" cy="12" r="7.8" stroke="currentColor" strokeWidth="1.8" /><path d="m12 4.8 3 2.2-1.1 3.4H10L9 7zm-4.8 7.1L10 10.4m4 0 2.8 1.5M9.4 17.8l.8-3.2h3.6l.8 3.2m-7-2.1 2 .9m7.2-.9-2 .9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></> : null}
      {name === 'book' ? <><path d="M5.5 6.5A2.5 2.5 0 0 1 8 4h10.5v15H8a2.5 2.5 0 1 0 0 0H5.5z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" /><path d="M8 4v15" stroke="currentColor" strokeWidth="1.9" /></> : null}
      {name === 'bolt' ? <path d="M13.2 3 6.8 12h4l-1.1 9L17.2 12H13z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2" /> : null}
      {name === 'brain' ? <><path d="M9 6.2a3.2 3.2 0 0 1 5.8 1.4 3 3 0 0 1 2.6 3.1 3 3 0 0 1-1 2.2 3 3 0 0 1 .1 4.2 3.1 3.1 0 0 1-4.2.3 3.1 3.1 0 0 1-4.5-.2 3 3 0 0 1-.7-3.9 2.9 2.9 0 0 1-.9-2.2A3 3 0 0 1 8.6 8 3 3 0 0 1 9 6.2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M10 8.4c.8.2 1.4.8 1.7 1.5M14 8.1c-.8.2-1.5.8-1.8 1.6M9.6 13a2.1 2.1 0 0 0 2.2-.1m2.6.1a2.2 2.2 0 0 1-2.2 0M10.8 10.2V17m2.4-6.6V17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /></> : null}
      {name === 'castle' ? <><path d="M5 19V9h3V6h3v3h2V6h3v3h3v10Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M10 19v-4h4v4M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></> : null}
      {name === 'check' ? <path d="m6 12.5 3.2 3.2L18 7.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" /> : null}
      {name === 'chevron-down' ? <path d="m7 10 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" /> : null}
      {name === 'clover' ? <><path d="M12 11.2c1.4-2 2-3.2 2-4.4A2.2 2.2 0 0 0 12 4.5a2.2 2.2 0 0 0-2 2.3c0 1.2.6 2.4 2 4.4Zm0 0c-2-1.4-3.2-2-4.4-2A2.2 2.2 0 0 0 5.3 11 2.2 2.2 0 0 0 7.6 13c1.2 0 2.4-.6 4.4-2Zm0 0c2 1.4 3.2 2 4.4 2a2.2 2.2 0 0 0 2.3-2 2.2 2.2 0 0 0-2.3-1.8c-1.2 0-2.4.6-4.4 2Zm0 0c-1.4 2-2 3.2-2 4.4a2.2 2.2 0 0 0 2 2.3 2.2 2.2 0 0 0 2-2.3c0-1.2-.6-2.4-2-4.4Zm0 5.6v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></> : null}
      {name === 'coin' ? <><circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.9" /><circle cx="12" cy="12" r="5.1" stroke="currentColor" strokeWidth="1.9" /><path d="M10.2 12h3.6M12 10.2V13.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" /></> : null}
      {name === 'copy' ? <><rect x="8" y="7" width="10" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M6 15H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></> : null}
      {name === 'crown' ? <><path d="m4.5 17 1.6-8.5L10 12l2-5.5 2 5.5 3.9-3.5L19.5 17Z" fill="currentColor" opacity="0.18" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" /><path d="M7 19h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" /></> : null}
      {name === 'culture' ? <><path d="M6 19h12M7.5 19V9m9 10V9M5 9h14l-7-4Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M9.5 9v6m5-6v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></> : null}
      {name === 'desert' ? <><path d="M4 17c2.4-1.9 4.5-2.8 6.4-2.8 2.5 0 3.6 1.5 5.5 1.5 1.1 0 2.4-.4 4.1-1.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M7 13.5c1.1-1.5 2.5-2.2 4.2-2.2 1.8 0 3.3.7 4.8 2.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><circle cx="17.5" cy="7" r="1.7" fill="currentColor" opacity="0.3" /></> : null}
      {name === 'dice' ? <><rect x="5.3" y="5.3" width="13.4" height="13.4" rx="3.4" stroke="currentColor" strokeWidth="1.9" /><circle cx="9" cy="9" r="1.1" fill="currentColor" /><circle cx="12" cy="12" r="1.1" fill="currentColor" /><circle cx="15" cy="15" r="1.1" fill="currentColor" /></> : null}
      {name === 'dna' ? <><path d="M8 5c4 2.5 4 11.5 8 14M16 5C12 7.5 12 16.5 8 19M9.2 7.7h5.6m-6.7 3.8h7.8m-7.8 3.8h7.8m-6.7 3.7h5.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></> : null}
      {name === 'fire' ? <path d="M12.3 3.8c1.1 2 1 3.7-.4 5 1.9-.4 3.8 1.2 3.8 3.6a3.9 3.9 0 1 1-7.8 0c0-1.6.8-3 2.2-3.9-.1 1.2.4 2.1 1.4 2.8-.2-2 .3-4.3.8-7.5Z" fill="currentColor" /> : null}
      {name === 'fireworks' ? <><path d="M12 4v4m0 8v4M4 12h4m8 0h4M6.6 6.6l2.8 2.8m5.2 5.2 2.8 2.8m0-10.8-2.8 2.8m-5.2 5.2-2.8 2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><circle cx="12" cy="12" r="2.3" fill="currentColor" opacity="0.22" stroke="currentColor" strokeWidth="1.6" /></> : null}
      {name === 'flag' ? <><path d="M7 20V4m0 0h8l-1.8 2L15 8H7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" /></> : null}
      {name === 'galaxy' ? <><path d="M12 6.2c4.2 0 7.6 2.6 7.6 5.8S16.2 17.8 12 17.8 4.4 15.2 4.4 12 7.8 6.2 12 6.2Z" stroke="currentColor" strokeWidth="1.8" /><path d="M8.4 8.4c1.7 1.2 3.6 1.7 5.8 1.7 1.4 0 2.7-.2 3.8-.7M8.6 15.6c2-1.2 3.6-2.7 4.7-5.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /><circle cx="10.4" cy="11.3" r="1.2" fill="currentColor" /></> : null}
      {name === 'globe' ? <><circle cx="12" cy="12" r="7.8" stroke="currentColor" strokeWidth="1.8" /><path d="M4.8 12h14.4M12 4.2c2.2 2.1 3.3 4.7 3.3 7.8S14.2 17.7 12 19.8M12 4.2C9.8 6.3 8.7 8.9 8.7 12s1.1 5.7 3.3 7.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /></> : null}
      {name === 'handshake' ? <><path d="M6.2 11.2 4 9l2.3-2.3c1.2-1.2 3-1.2 4.2 0l1.4 1.4m-.2 7.5 1.2 1.2c1 1 2.7 1 3.7 0l3.3-3.3a2.6 2.6 0 0 0 0-3.7L17.4 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="m8.6 12 2 2c.9.9 2.4.9 3.3 0l3.3-3.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></> : null}
      {name === 'heart' ? <path d="M12 19s-6.8-4.2-6.8-9.2c0-2.2 1.6-3.8 3.6-3.8 1.5 0 2.6.8 3.2 2 0.6-1.2 1.8-2 3.2-2 2 0 3.6 1.6 3.6 3.8C18.8 14.8 12 19 12 19Z" fill="currentColor" /> : null}
      {name === 'history' ? <><path d="M12 6.5v5l3 1.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" /><path d="M5 7.5V4.8m14 2.7V4.8M6 12a6 6 0 1 0 1.8-4.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" /></> : null}
      {name === 'language' ? <><path d="M5 7h8M9 7c-.5 4.1-2.1 7.1-4.7 9M6.3 12c1.6 2 3.4 3.3 5.7 4M14.5 8h4m-2 0c-.3 3.5-1.4 6.4-3.2 8.7m1.3-3.2c1 .6 2.1 1 3.4 1.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></> : null}
      {name === 'leaf' ? <path d="M18.2 5.5c-5 .3-8.3 2.5-10 6.6-.7 1.6-.8 3.3-.4 5.4 2.2.4 4 .3 5.5-.4 4-1.8 6.2-5.1 6.5-10.1 0-.8-.7-1.5-1.6-1.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /> : null}
      {name === 'link' ? <><path d="M10 14a3.5 3.5 0 0 0 5 0l4-4a3.5 3.5 0 0 0-5-5l-.5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M14 10a3.5 3.5 0 0 0-5 0l-4 4a3.5 3.5 0 0 0 5 5l.5-.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></> : null}
      {name === 'map' ? <><path d="M4.5 6.8 9 4.5l6 2.2 4.5-2.2v12.7L15 19.5l-6-2.2-4.5 2.2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M9 4.5v12.8M15 6.7v12.8" stroke="currentColor" strokeWidth="1.6" /></> : null}
      {name === 'math' ? <><rect x="6.2" y="4.2" width="11.6" height="15.6" rx="2.2" stroke="currentColor" strokeWidth="1.8" /><path d="M8.5 8.2h7M9 12h1.8m3.4 0H16M9 15.6h1.8m3.4 0H16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></> : null}
      {name === 'medal' ? <><path d="M8.3 4h3l.7 3.2H9Zm4.4 0h3l-1.4 3.2h-3Z" fill="currentColor" opacity="0.26" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" /><circle cx="12" cy="14" r="4.4" stroke="currentColor" strokeWidth="1.8" /><path d="m12 11.8.8 1.6 1.8.3-1.3 1.2.3 1.7-1.6-.9-1.6.9.3-1.7-1.3-1.2 1.8-.3Z" fill="currentColor" /></> : null}
      {name === 'moon' ? <path d="M15.9 4.8a6.8 6.8 0 1 0 3.3 12.5 7.2 7.2 0 1 1-3.3-12.5Z" fill="currentColor" /> : null}
      {name === 'music' ? <><path d="M15.5 5.5v9.2a2.3 2.3 0 1 1-1.8-2.2V7.3l-6 1.4v7a2.3 2.3 0 1 1-1.8-2.2V7.2c0-.8.5-1.5 1.3-1.7l6.2-1.5c1.1-.3 2.1.6 2.1 1.5Z" fill="currentColor" /></> : null}
      {name === 'palm' ? <><path d="M12 20v-7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" /><path d="M12 11.6c.6-3 2.5-4.9 5.6-5.6-1.5 2.8-3.4 4.3-5.6 4.7M12 11.6C11.4 8.6 9.5 6.7 6.4 6c1.5 2.8 3.4 4.3 5.6 4.7M12 12.2c1.7-1.8 4-2.5 6.8-2.2-2.1 1.9-4.4 2.8-6.8 2.8M12 12.2c-1.7-1.8-4-2.5-6.8-2.2 2.1 1.9 4.4 2.8 6.8 2.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></> : null}
      {name === 'paw' ? <><circle cx="8" cy="8.2" r="1.6" fill="currentColor" /><circle cx="12" cy="6.4" r="1.6" fill="currentColor" /><circle cx="16" cy="8.2" r="1.6" fill="currentColor" /><circle cx="18.1" cy="11.6" r="1.5" fill="currentColor" /><path d="M12 11c-2.8 0-5 2.1-5 4.4 0 1.5 1 2.6 2.4 2.6.8 0 1.4-.3 2-.8.3-.3.9-.3 1.2 0 .6.5 1.2.8 2 .8 1.4 0 2.4-1.1 2.4-2.6 0-2.3-2.2-4.4-5-4.4Z" fill="currentColor" /></> : null}
      {name === 'planet' ? <><circle cx="12" cy="12" r="4.2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.7" /><path d="M4 12.2c2-1.9 4.7-3 8-3 3.6 0 6.5 1 8 2.8-1.8 1.8-4.6 2.8-8 2.8-3.4 0-6.2-1-8-2.6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></> : null}
      {name === 'puzzle' ? <path d="M9.2 5.2a2.2 2.2 0 0 1 4.4 0H17a2 2 0 0 1 2 2v3.4a2.2 2.2 0 1 1 0 4.4V18a2 2 0 0 1-2 2h-3.4a2.2 2.2 0 1 0-4.4 0H6a2 2 0 0 1-2-2v-3.4a2.2 2.2 0 1 0 0-4.4V7.2a2 2 0 0 1 2-2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /> : null}
      {name === 'rainbow' ? <><path d="M5 17a7 7 0 0 1 14 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><path d="M7.8 17a4.2 4.2 0 0 1 8.4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><path d="M10.6 17a1.4 1.4 0 0 1 2.8 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></> : null}
      {name === 'robot' ? <><rect x="4" y="6" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2v4M8 2v4M16 2v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><circle cx="9" cy="11" r="1.5" fill="currentColor" /><circle cx="15" cy="11" r="1.5" fill="currentColor" /><path d="M9 15h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></> : null}
      {name === 'science' ? <><path d="M10 4v4l-4.2 7.2A2.5 2.5 0 0 0 8 19h8a2.5 2.5 0 0 0 2.2-3.8L14 8V4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M8.8 13h6.4M9.8 15.8h4.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></> : null}
      {name === 'settings' ? <><path d="M12 8.7a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6Z" stroke="currentColor" strokeWidth="1.8" /><path d="m19 12-1.6.6a5.6 5.6 0 0 1-.5 1.3l.8 1.5-1.7 1.7-1.5-.8a5.6 5.6 0 0 1-1.3.5L12 19l-1-.2a5.6 5.6 0 0 1-1.3-.5l-1.5.8-1.7-1.7.8-1.5a5.6 5.6 0 0 1-.5-1.3L5 12l.2-1a5.6 5.6 0 0 1 .5-1.3l-.8-1.5 1.7-1.7 1.5.8a5.6 5.6 0 0 1 1.3-.5L12 5l1 .2a5.6 5.6 0 0 1 1.3.5l1.5-.8 1.7 1.7-.8 1.5a5.6 5.6 0 0 1 .5 1.3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></> : null}
      {name === 'snowflake' ? <><path d="M12 4v16M6.7 7l10.6 10M17.3 7 6.7 17M8.5 4.8 12 7l3.5-2.2M8.5 19.2 12 17l3.5 2.2M4.8 8.5 7 12l-2.2 3.5M19.2 8.5 17 12l2.2 3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></> : null}
      {name === 'sound' ? <><path d="M5 10h3l4-3v10l-4-3H5Z" fill="currentColor" /><path d="M15.5 9.2a4 4 0 0 1 0 5.6M17.6 7.2a6.8 6.8 0 0 1 0 9.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></> : null}
      {name === 'sparkle' ? <><path d="M12 4.5 13.7 9l4.8 1.7-4.8 1.6L12 17l-1.7-4.7-4.8-1.6L10.3 9ZM18 4l.7 1.8 1.8.7-1.8.7L18 9l-.7-1.8-1.8-.7 1.8-.7ZM6 15l.8 2.1 2.2.8-2.2.8L6 21l-.8-2.3-2.2-.8 2.2-.8Z" fill="currentColor" /></> : null}
      {name === 'star' ? <><path d="m12 4.4 2.3 4.7 5.2.8-3.7 3.6.9 5.1L12 16.2 7.3 18.6l.9-5.1-3.7-3.6 5.2-.8Z" fill="currentColor" /></> : null}
      {name === 'store' ? <><path d="M5 9.2h14V19H5Zm1.2-4.2h11.6l1.2 4.2H5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" /><path d="M8.2 13.2v5.8m7.6-5.8v5.8M10.8 13.2h2.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></> : null}
      {name === 'target' ? <><circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="1.7" fill="currentColor" /></> : null}
      {name === 'tech' ? <><rect x="7" y="7" width="10" height="10" rx="1.8" stroke="currentColor" strokeWidth="1.8" /><path d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m14 0h2M3 15h2m14 0h2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></> : null}
      {name === 'timer' ? <><path d="M9 4h6M12 4v2.2M8.1 8.1a5.5 5.5 0 1 0 7.8 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M12 12 15 10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></> : null}
      {name === 'token-blue' ? tokenIcon('#5ca8ff', '#d9f0ff') : null}
      {name === 'token-green' ? tokenIcon('#63c46f', '#e9ffe9') : null}
      {name === 'token-red' ? tokenIcon('#ef6b5f', '#ffe1dd') : null}
      {name === 'token-yellow' ? tokenIcon('#f1c54d', '#fff6cf') : null}
      {name === 'user' ? <><circle cx="12" cy="8.2" r="3.2" stroke="currentColor" strokeWidth="1.8" /><path d="M6.2 18.3a6 6 0 0 1 11.6 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></> : null}
      {name === 'users' ? <><circle cx="9" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M4 17a5 5 0 0 1 10 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><circle cx="16" cy="9" r="2" stroke="currentColor" strokeWidth="1.8" /><path d="M14 16a4 4 0 0 1 6 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></> : null}
      {name === 'volcano' ? <><path d="M5 18h14l-3.2-6.2-2.2 1.7-2.1-5.2-2.2 4.1-1.3-1.1Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M13.8 6.6c0 1.2.7 2.2 1.7 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></> : null}
      {name === 'wallet' ? <><path d="M5 7.5A2.5 2.5 0 0 1 7.5 5H18v14H7.5A2.5 2.5 0 0 1 5 16.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M18 10h-4a1.8 1.8 0 0 0 0 3.6h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><circle cx="14.5" cy="11.8" r=".8" fill="currentColor" /></> : null}
      {name === 'wand' ? <><path d="m6 18 8.3-8.3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /><path d="m14.8 6.2.5 1.3 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5ZM18.5 10.8l.4 1.1 1.1.4-1.1.4-.4 1.2-.4-1.2-1.1-.4 1.1-.4ZM8.5 14.5l.5 1.3 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5Z" fill="currentColor" /></> : null}
    </svg>
  )
}

export type { ArcadeIconName }
