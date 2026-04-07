'use client'

import { Mic, MicOff, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  onRecorded: (file: File) => void
  disabled?: boolean
}

export function AudioRecorder({ onRecorded, disabled }: AudioRecorderProps) {
  const { state, duration, start, stop, cancel } = useAudioRecorder()

  async function handleToggle() {
    if (state === 'idle') {
      await start()
    } else if (state === 'recording') {
      const file = await stop()
      if (file) onRecorded(file)
    }
  }

  function formatDuration(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-1">
      {state === 'recording' && (
        <>
          <span className="text-xs text-red-400 font-mono tabular-nums">
            {formatDuration(duration)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={cancel}
            className="h-8 w-8 text-slate-500 hover:text-red-400"
          >
            <Square className="w-4 h-4" />
          </Button>
        </>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'h-8 w-8',
          state === 'recording'
            ? 'text-red-400 hover:text-red-300 animate-pulse'
            : 'text-slate-500 hover:text-white'
        )}
        title={state === 'recording' ? 'Parar gravação' : 'Gravar áudio'}
      >
        {state === 'recording' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>
    </div>
  )
}
