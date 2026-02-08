'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check } from 'lucide-react'

interface Step {
  id: number
  title: string
  description: string
  emoji: string
}

const steps: Step[] = [
  {
    id: 0,
    title: 'Welcome to DeepRead',
    description: 'Your personal library for deep, focused learning. Upload PDFs, track your progress, and master every book.',
    emoji: '📖',
  },
  {
    id: 1,
    title: 'Upload Your Books',
    description: 'Drag and drop your PDFs or select files from your device. We\'ll process them automatically.',
    emoji: '📥',
  },
  {
    id: 2,
    title: 'Start Learning',
    description: 'Read with AI assistance, take notes, and test your understanding. Join thousands of readers.',
    emoji: '✨',
  },
]

const ONBOARDING_KEY = 'deepread-onboarding-completed'

export function OnboardingTutorial() {
  const [isOpen, setIsOpen] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (!completed) {
      setIsOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setIsOpen(false)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  if (!isClient) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden border-border/60">
        <DialogTitle className="sr-only">
          Welcome to DeepRead - Onboarding Tutorial
        </DialogTitle>
        
        {/* Progress Bar - Top */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        <div className="p-8 pb-6 pt-16">
          {/* Step Content - Fixed height to prevent layout shift */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col items-center text-center justify-center"
            >
              {/* Large Emoji */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-5xl mb-6"
              >
                {steps[currentStep].emoji}
              </motion.div>

              {/* Title */}
              <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
                {steps[currentStep].title}
              </h2>

              {/* Description - Fixed height container */}
                <p className="text-muted-foreground leading-relaxed max-w-md">
                  {steps[currentStep].description}
                </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {steps.map((step, index) => (
              <motion.button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600 w-6'
                    : 'bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50'
                }`}
                animate={{
                  width: index === currentStep ? 24 : 8,
                }}
                transition={{ duration: 0.3 }}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>

            <Button
              onClick={handleNext}
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="h-4 w-4" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
