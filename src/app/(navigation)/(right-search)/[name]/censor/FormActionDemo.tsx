'use client'

import { useState, useTransition } from 'react'

// ❌ OLD WAY: Controlled Input with State
export function ControlledExample() {
  const [input, setInput] = useState('')
  const [isSubmitting, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!input.trim()) return

    startTransition(() => {
      console.log('Submitting:', input)
      // Process the input...
      setInput('') // Reset state
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="data"
        onChange={(e) => setInput(e.target.value)}
        placeholder="Controlled input (with state)"
        value={input}
      />
      <button disabled={!input.trim() || isSubmitting}>Submit</button>
    </form>
  )
}

// ✅ NEW WAY: Form Actions (Uncontrolled)
export function FormActionExample() {
  const [isSubmitting, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const input = formData.get('data') as string

    if (!input?.trim()) return

    startTransition(() => {
      console.log('Submitting:', input)
      // Process the input...
      e.currentTarget.reset() // Reset form
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="data" placeholder="Uncontrolled input (form action)" />
      <button disabled={isSubmitting}>Submit</button>
    </form>
  )
}

// 🚀 ADVANCED: Server Actions (Next.js 14+)
export function ServerActionExample() {
  async function submitAction(formData: FormData) {
    'use server' // This would be a server action

    const input = formData.get('data') as string
    if (!input?.trim()) return

    // Process on server...
    console.log('Server processing:', input)
  }

  return (
    <form action={submitAction}>
      <input name="data" placeholder="Server action example" />
      <button type="submit">Submit</button>
    </form>
  )
}

/* 
Benefits of Form Actions:
1. ⚡ Better performance - no re-renders on every keystroke
2. 🎯 Simpler code - no state management needed
3. 🔄 Works with progressive enhancement
4. 🚀 Ready for server actions
5. 📦 Smaller bundle size - less JavaScript
6. ♿ Better accessibility - native form behavior

When to use controlled inputs:
- Real-time validation as user types
- Complex formatting (e.g., phone numbers)
- Dependent form fields
- Search-as-you-type features
*/
