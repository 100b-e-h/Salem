'use client';

import React, { useState } from 'react';

interface TabsProps {
    children: React.ReactNode;
    defaultValue: string;
}

interface TabsListProps {
    children: React.ReactNode;
}

interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
}

interface TabsContentProps {
    value: string;
    children: React.ReactNode;
}

const TabsContext = React.createContext<{
    activeTab: string;
    setActiveTab: (value: string) => void;
}>({
    activeTab: '',
    setActiveTab: () => { },
});

export const Tabs: React.FC<TabsProps> = ({ children, defaultValue }) => {
    const [activeTab, setActiveTab] = useState(defaultValue);

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className="w-full">
                {children}
            </div>
        </TabsContext.Provider>
    );
};

export const TabsList: React.FC<TabsListProps> = ({ children }) => {
    return (
        <div className="tabs-folder-list w-full">
            {children}
        </div>
    );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children }) => {
    const { activeTab, setActiveTab } = React.useContext(TabsContext);

    return (
        <button
            onClick={() => setActiveTab(value)}
            className={`tabs-folder-trigger ${activeTab === value ? 'active' : ''}`}
        >
            {children}
        </button>
    );
};

export const TabsContent: React.FC<TabsContentProps> = ({ value, children }) => {
    const { activeTab } = React.useContext(TabsContext);

    if (activeTab !== value) return null;

    return (
        <div className="tabs-folder-content">
            {children}
        </div>
    );
};