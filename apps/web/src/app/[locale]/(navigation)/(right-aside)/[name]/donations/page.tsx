import { getUsernameFromParam } from '@litomi/std'

import DonationsAuthGate from './DonationsAuthGate'

export default async function Page({ params }: PageProps<'/[locale]/[name]/donations'>) {
  const { name } = await params
  const usernameFromParam = getUsernameFromParam(name)

  return <DonationsAuthGate username={usernameFromParam} />
}
