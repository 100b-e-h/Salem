'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/InvoiceTabs';
import { GeneralInvoicesTab } from './components/GeneralInvoicesTab';
import { SubscriptionsTab } from './components/SubscriptionsTab';
import { InstallmentsTab } from './components/InstallmentsTab';

export default function InvoicesPage() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-4">Acesso Negado</h1>
                    <p className="text-muted-foreground">Você precisa estar logado para acessar esta página.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">💳 Gestão de Faturas</h1>
                <p className="text-muted-foreground mt-2">
                    Visualize e gerencie faturas, assinaturas e compras parceladas
                </p>
            </div>

            <Tabs defaultValue="invoices">
                <TabsList>
                    <TabsTrigger value="invoices">
                        💳 Faturas Gerais
                    </TabsTrigger>
                    <TabsTrigger value="subscriptions">
                        🔄 Assinaturas
                    </TabsTrigger>
                    <TabsTrigger value="installments">
                        📊 Parceladas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invoices">
                    <GeneralInvoicesTab user={user} />
                </TabsContent>

                <TabsContent value="subscriptions">
                    <SubscriptionsTab user={user} />
                </TabsContent>

                <TabsContent value="installments">
                    <InstallmentsTab user={user} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
