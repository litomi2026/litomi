import { LIBO_PAGE_LAYOUT } from './constant'

export default function Loading() {
  return (
    <div className={LIBO_PAGE_LAYOUT.container}>
      <div
        className={`${LIBO_PAGE_LAYOUT.balanceCardReserved} rounded-xl border border-amber-500/30 bg-amber-500/10`}
      />
      <div className={`${LIBO_PAGE_LAYOUT.tabsReserved} rounded-lg bg-zinc-800/50`} />
      <div className={`${LIBO_PAGE_LAYOUT.panelReserved} rounded-lg bg-zinc-800/20`} />
    </div>
  )
}
