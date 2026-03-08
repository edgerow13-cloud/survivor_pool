import { RulesBackLink } from './RulesBackLink'

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Orange accent bar */}
      <div className="h-1 bg-[#F97316]" />

      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        {/* Header */}
        <div className="mb-10">
          <RulesBackLink />
          <h1 className="text-3xl font-bold text-gray-900">Pool Rules</h1>
          <p className="mt-2 text-gray-500">Survivor 50 — Season 50 All Stars</p>
        </div>

        <div className="space-y-8">

          {/* How It Works */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="inline-block w-1 h-5 rounded-full bg-[#F97316]" />
              How It Works
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              <Rule>
                Each week, every active pool participant picks one Survivor castaway they think
                will survive that episode.
              </Rule>
              <Rule>
                If your castaway is voted out, medically evacuated, or otherwise leaves the game
                that episode — you&apos;re eliminated from the pool.
              </Rule>
              <Rule>
                The pool runs from <strong>Episode 3</strong> onwards. Episodes 1 and 2 are
                pre-pool; no picks were collected for those weeks.
              </Rule>
              <Rule>
                The last player (or players) still standing at the end of the season wins.
              </Rule>
            </div>
          </section>

          {/* Pick Rules */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="inline-block w-1 h-5 rounded-full bg-[#F97316]" />
              Pick Rules
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              <Rule label="One pick per week">
                You submit exactly one castaway per episode. You cannot change your pick after
                the deadline.
              </Rule>
              <Rule label="One-and-done">
                You cannot pick the same castaway more than once across the entire season. Once
                you&apos;ve used a castaway, they&apos;re gone from your available options forever.
              </Rule>
              <Rule label="Picks lock at air time">
                The pick deadline is the episode&apos;s scheduled air time. Submissions close
                server-side at that moment — not when you close your browser tab. Plan ahead.
              </Rule>
              <Rule label="Shared picks are allowed">
                Multiple players can pick the same castaway in any given week. There is no
                exclusivity on picks.
              </Rule>
              <Rule label="Missing the deadline">
                If you have no pick when the deadline passes, your outcome for that week
                is <span className="font-medium text-[#DC2626]">No Pick</span> and you are
                eliminated from the pool. The commissioner may override this in exceptional
                circumstances.
              </Rule>
            </div>
          </section>

          {/* Outcomes */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="inline-block w-1 h-5 rounded-full bg-[#16A34A]" />
              Outcomes
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 shrink-0">
                  Safe
                </span>
                <p className="text-sm text-gray-700">
                  Your castaway survived the episode. You stay in the pool and move on to the
                  next week.
                </p>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 shrink-0">
                  Eliminated
                </span>
                <p className="text-sm text-gray-700">
                  Your castaway was voted out or left the game. You are eliminated from the pool.
                  You can still view all picks as a spectator, but you cannot submit future picks.
                </p>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 shrink-0 whitespace-nowrap">
                  No Pick
                </span>
                <p className="text-sm text-gray-700">
                  No pick was submitted before the deadline. You are automatically eliminated.
                </p>
              </div>
            </div>
          </section>

          {/* Picks Grid Visibility */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="inline-block w-1 h-5 rounded-full bg-[#F97316]" />
              Pick Visibility
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              <Rule>
                Picks are <strong>hidden from other players</strong> until the episode deadline
                passes. Before lock, you can only see your own pick for the current week.
              </Rule>
              <Rule>
                Once the week is locked and results are entered by the commissioner, all picks
                for that week become visible to everyone.
              </Rule>
              <Rule>
                Picks from previous weeks are always visible in the full picks grid.
              </Rule>
            </div>
          </section>

          {/* Tribes */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="inline-block w-1 h-5 rounded-full bg-[#F97316]" />
              Tribe Colors
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              <Rule>
                Each castaway&apos;s tribe affiliation is shown as a colored dot in the picks
                grid. Tribe colors reflect the castaway&apos;s tribe <em>during that specific
                week</em>, not their original or current tribe.
              </Rule>
              <Rule>
                After a tribe swap or merge, the dot color in past weeks stays the same —
                it reflects where the castaway was at the time of that pick.
              </Rule>
            </div>
          </section>

          {/* Commissioner */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="inline-block w-1 h-5 rounded-full bg-[#F97316]" />
              Commissioner
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              <Rule>
                The commissioner (Eddie) runs the pool. He adds players, enters weekly results,
                and can override picks in exceptional circumstances.
              </Rule>
              <Rule>
                The commissioner can reinstate an eliminated player if a technical error or
                extenuating circumstance warrants it.
              </Rule>
              <Rule>
                If multiple players are eliminated in the same final episode, the commissioner
                handles any tiebreak manually.
              </Rule>
            </div>
          </section>

          {/* Footer */}
          <p className="text-xs text-center text-gray-400 pt-2">
            Questions? Text Eddie.
          </p>

        </div>
      </div>
    </div>
  )
}

function Rule({
  label,
  children,
}: {
  label?: string
  children: React.ReactNode
}) {
  return (
    <div className="px-4 py-3">
      <p className="text-sm text-gray-700 leading-relaxed">
        {label && <span className="font-semibold text-gray-900">{label}: </span>}
        {children}
      </p>
    </div>
  )
}
