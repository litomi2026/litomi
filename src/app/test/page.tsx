import Firework from '@/components/firework/Firework'

export default function TestPage() {
  return (
    <div className="fixed inset-0 bg-black">
      <Firework
        className="h-full w-full"
        config={{
          autoLaunch: true,
          quality: '2',
          finale: true,
          hideControls: false,
          longExposure: false,
          scaleFactor: 1.0,
          shell: 'Random',
          size: '3',
          skyLighting: '2',
        }}
      />
    </div>
  )
}
