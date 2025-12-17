"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "hsl(0 0% 100%)",
          "--normal-text": "hsl(0 0% 9%)",
          "--normal-border": "hsl(0 0% 92%)",
          "--success-bg": "hsl(143 85% 96%)",
          "--success-text": "hsl(140 65% 25%)",
          "--success-border": "hsl(145 80% 88%)",
          "--error-bg": "hsl(0 86% 97%)",
          "--error-text": "hsl(0 72% 40%)",
          "--error-border": "hsl(0 80% 90%)",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast backdrop-blur-sm shadow-lg border",
          success: "!bg-[--success-bg] !text-[--success-text] !border-[--success-border]",
          error: "!bg-[--error-bg] !text-[--error-text] !border-[--error-border]",
          title: "font-semibold text-sm",
          description: "text-sm opacity-90",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
