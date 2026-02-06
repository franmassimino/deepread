'use client'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PanelRightClose, StickyNote, FileText, Sparkles } from 'lucide-react'
import { NotesTab } from './notes-tab'
import { TemplateTab } from './template-tab'
import { AIAssistantTab } from './ai-assistant-tab'

interface LearningSidebarProps {
  isOpen: boolean
  onToggle: () => void
  activeTab: string
  onTabChange: (value: string) => void
}

export function LearningSidebar({ isOpen, onToggle, activeTab, onTabChange }: LearningSidebarProps) {
  const handleOpenWithTab = (tab: string) => {
    if (!isOpen) {
      onTabChange(tab)
      onToggle()
    }
  }

  return (
    <div className="h-full bg-background border-l flex flex-col">
      {/* Sidebar Header with Toggle */}
      <div className={`flex items-center justify-between border-b shrink-0 ${isOpen ? 'p-2' : 'p-1'}`}>
        {isOpen && (
          <h3 className="text-sm font-semibold text-foreground pl-4 whitespace-nowrap">
            Learning Tools
          </h3>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={`text-muted-foreground hover:text-foreground shrink-0 ${isOpen ? 'ml-auto' : 'mx-auto'}`}
        >
          {isOpen ? (
            <PanelRightClose className="h-4 w-4 mr-2" />
          ) : (
            <PanelRightClose className="h-4 w-4 rotate-180" />
          )}
        </Button>
      </div>

      {isOpen ? (
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="pl-6 pr-3 py-6">
              <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="notes" className="text-xs">
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="template" className="text-xs">
                    Template
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs">
                    AI Assistant
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="pr-3">
                  <NotesTab />
                </TabsContent>

                <TabsContent value="template" className="pr-3">
                  <TemplateTab />
                </TabsContent>

                <TabsContent value="ai" className="pr-3">
                  <AIAssistantTab />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center gap-1 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenWithTab('notes')}
            className="flex flex-col items-center justify-center h-10 w-10 p-1 hover:bg-accent rounded-lg group"
            title="Notes"
          >
            <StickyNote className="h-5 w-5 text-muted-foreground group-hover:text-foreground mb-1" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenWithTab('template')}
            className="flex flex-col items-center justify-center h-10 w-10 p-1 hover:bg-accent rounded-lg group"
            title="Template"
          >
            <FileText className="h-5 w-5 text-muted-foreground group-hover:text-foreground mb-1" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenWithTab('ai')}
            className="flex flex-col items-center justify-center h-10 w-10 p-1 hover:bg-accent rounded-lg group"
            title="AI Assistant"
          >
            <Sparkles className="h-5 w-5 text-muted-foreground group-hover:text-foreground mb-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
