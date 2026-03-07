import { isSkinAvatar } from '../../lib/player-skins'

type GameAvatarProps = {
  avatar: string
  alt: string
  imageClassName?: string
  textClassName?: string
}

export function GameAvatar({
  avatar,
  alt,
  imageClassName = 'h-full w-full object-contain',
  textClassName = '',
}: GameAvatarProps) {
  if (isSkinAvatar(avatar)) {
    return <img alt={alt} className={imageClassName} src={avatar} />
  }

  return <span className={textClassName}>{avatar}</span>
}
