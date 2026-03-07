type ShopModalProps = {
  open: boolean
  onClose: () => void
}

const items = [
  {
    id: 'shield',
    name: 'Escudo',
    price: 120,
    effect: 'Cancela la proxima captura sobre una ficha',
    icon: 'SHD',
  },
  {
    id: 'reroll',
    name: 'Re-roll',
    price: 90,
    effect: 'Permite repetir un dado antes de mover',
    icon: 'DIE',
  },
  {
    id: 'coin-boost',
    name: 'Boost de monedas',
    price: 100,
    effect: '+50% en la proxima respuesta correcta',
    icon: 'COIN',
  },
]

export function ShopModal({ open, onClose }: ShopModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#091b39]/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[26px] border-2 border-[#fce29f] bg-gradient-to-b from-[#1e5ea2] via-[#184886] to-[#12356a] p-4 text-white shadow-board">
        <header className="game-wood px-4 py-2 text-center">
          <p className="font-display text-3xl uppercase">Tienda segura</p>
        </header>

        <p className="mt-3 rounded-2xl border border-[#7ed957] bg-[#7ed957]/20 px-3 py-2 text-sm font-semibold text-[#e8ffd8]">
          Solo puedes comprar 1 item por turno en SAFE_SHOP.
        </p>

        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              className="flex flex-col gap-2 rounded-2xl border border-[#e7c875] bg-[#fff8df] p-3 text-board-night sm:flex-row sm:items-center sm:justify-between"
              key={item.id}
            >
              <div>
                <p className="font-display text-2xl">
                  <span aria-hidden>{item.icon}</span> {item.name}
                </p>
                <p className="text-xs font-semibold text-board-night/70">{item.effect}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="coin-pill">{item.price} G</span>
                <button className="action-button-primary max-w-[170px]" type="button">
                  Comprar
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-end">
          <button className="action-button-secondary max-w-[220px]" onClick={onClose} type="button">
            Cerrar tienda
          </button>
        </div>
      </div>
    </div>
  )
}
