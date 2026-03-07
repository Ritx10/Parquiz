import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="mx-auto mt-16 max-w-xl rounded-3xl border border-white/80 bg-white/80 p-8 text-center shadow-float">
      <p className="font-display text-xs uppercase tracking-[0.24em] text-board-ink/70">
        404
      </p>
      <h2 className="mt-3 font-display text-3xl text-board-ink">Screen not found</h2>
      <p className="mt-2 text-board-ink/80">
        La ruta no existe en este scaffold del frontend.
      </p>
      <Link
        className="mt-6 inline-flex rounded-full bg-board-coral px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-board-coral/90"
        to="/"
      >
        Volver al Home
      </Link>
    </section>
  )
}
