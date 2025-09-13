type Props = {
  userId: number
}

export default async function TwoFactorSettings({ userId }: Props) {
  return <pre>{JSON.stringify(userId, null, 2)}</pre>
}
