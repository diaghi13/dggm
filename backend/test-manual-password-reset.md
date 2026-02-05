# Test Manuale - Password Reset

## 1. Test Forgot Password

```bash
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Expected**:
- Response 200 con `"message": "Password reset link sent to your email"`
- Email su Mailtrap con link

## 2. Verifica Email su Mailtrap

1. Vai su https://mailtrap.io/inboxes
2. Apri l'email ricevuta
3. Copia il token dal link (o clicca il link per testare il redirect)

## 3. Test Reset Password

```bash
curl -X POST http://localhost:8000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "token": "YOUR_TOKEN_HERE",
    "password": "NewPassword123!",
    "password_confirmation": "NewPassword123!"
  }'
```

**Expected**: Response 200 con `"message": "Password reset successfully"`

## 4. Test Login con Nuova Password

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "NewPassword123!"
  }'
```

## 5. Test Change Password (autenticato)

```bash
curl -X POST http://localhost:8000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "current_password": "NewPassword123!",
    "password": "AnotherPassword456!",
    "password_confirmation": "AnotherPassword456!"
  }'
```

## Frontend Integration Checklist

### Page: `/reset-password`

```tsx
// app/(auth)/reset-password/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        email,
        password,
        password_confirmation: confirmPassword,
      }),
    })

    const data = await response.json()

    if (data.success) {
      // Redirect to login
      router.push('/login?message=Password reset successful')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### Page: `/forgot-password`

```tsx
// app/(auth)/forgot-password/page.tsx
'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await fetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (data.success) {
      alert('Check your email for reset instructions')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
      />
      <button type="submit">Send Reset Link</button>
    </form>
  )
}
```

### Page: `/profile/change-password`

```tsx
// app/(dashboard)/profile/change-password/page.tsx
'use client'

import { useState } from 'react'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await fetch('/api/v1/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`, // From your auth store
      },
      body: JSON.stringify({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      }),
    })

    const data = await response.json()

    if (data.success) {
      alert('Password changed successfully')
      // Reset form
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```