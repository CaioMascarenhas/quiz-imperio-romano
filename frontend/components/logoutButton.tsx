'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function LogoutButton() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    async function handleLogout() {
        try {
            setIsLoading(true)

            await fetch('/api/logout', {
                method: 'POST',
            })

            router.replace('/login')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleLogout}
            variant="destructive"
            size="lg"
            className="h-9 gap-2 px-4 font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saindo...
                </>
            ) : (
                <>
                    <LogOut className="h-4 w-4" />
                    Sair
                </>
            )}
        </Button>
    )
}