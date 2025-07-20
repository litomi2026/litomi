'use client'

import { useActionState } from 'react'

import { addCensorships, deleteCensorships, updateCensorships } from './action'

const initialState = {} as Awaited<ReturnType<typeof addCensorships>>
const initialDeleteState = {} as Awaited<ReturnType<typeof deleteCensorships>>
const initialUpdateState = {} as Awaited<ReturnType<typeof updateCensorships>>

type Props = {
  userId: string
}

export default function Censorships({ userId }: Readonly<Props>) {
  const [addState, addAction] = useActionState(addCensorships, initialState)
  const [deleteState, deleteAction] = useActionState(deleteCensorships, initialDeleteState)
  const [updateState, updateAction] = useActionState(updateCensorships, initialUpdateState)

  return null
}
