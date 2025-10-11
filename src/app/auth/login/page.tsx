'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

function LoginContent() {
    const { user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirect') || '/'

    useEffect(() => {
        if (user) {
            router.replace(redirectTo)
        }
    }, [user, router, redirectTo])

    if (user) {
        return null
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
                        Entre na sua conta
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Faça login para acessar o Salem
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <p className="text-center text-muted-foreground">
                        O sistema de autenticação será carregado automaticamente quando necessário.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                    <p className="mt-4 text-muted-foreground">Carregando...</p>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}