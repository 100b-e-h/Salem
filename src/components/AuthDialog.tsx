'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog'

interface AuthDialogProps {
    open: boolean
    onClose: () => void
}

export function AuthDialog({ open, onClose }: AuthDialogProps) {
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { signIn, signUp } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, fullName)
                if (error) {
                    setError(error.message)
                } else {
                    onClose()
                }
            } else {
                const { error } = await signIn(email, password)
                if (error) {
                    setError(error.message)
                } else {
                    onClose()
                }
            }
        } catch {
            setError('Ocorreu um erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setEmail('')
        setPassword('')
        setFullName('')
        setError('')
        setLoading(false)
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetForm()
            onClose()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isSignUp ? 'Criar Conta' : 'Entrar'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nome Completo</Label>
                            <Input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required={isSignUp}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col space-y-2">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="w-full"
                        >
                            {isSignUp
                                ? 'Já tem uma conta? Entrar'
                                : 'Não tem conta? Criar conta'
                            }
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}