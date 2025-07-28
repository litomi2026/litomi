export default function IconSmartCard({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2zm2 0h16v16H4V4zm3 3v5h5V7H7zm2 2h1v1H9V9zm5 0v2h5V9h-5zm0 4v2h5v-2h-5z" />
    </svg>
  )
}
