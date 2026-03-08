'use client'

import { Button } from '@/components/ui/button'

interface SubmitBarProps {
  selectedName: string | null
  selectedTribeName: string | null
  isSubmitted: boolean
  isLoading: boolean
  onSubmit: () => void
  onChangePick: () => void
}

export function SubmitBar({
  selectedName,
  selectedTribeName,
  isSubmitted,
  isLoading,
  onSubmit,
  onChangePick,
}: SubmitBarProps) {
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          {selectedName ? (
            <p className="text-sm text-gray-700">
              <span className="text-gray-500">Your pick:</span>{' '}
              <span className="font-semibold">{selectedName}</span>
              {selectedTribeName && (
                <span className="text-gray-500"> ({selectedTribeName})</span>
              )}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Select a contestant to pick</p>
          )}
        </div>

        {isSubmitted ? (
          <Button
            variant="outline"
            onClick={onChangePick}
            className="w-full sm:w-auto border-[#F97316] text-[#F97316] hover:bg-orange-50"
          >
            Change Pick
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={!selectedName || isLoading}
            className="w-full sm:w-auto bg-[#F97316] hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Submitting...' : selectedName ? 'Submit Pick' : 'Select a contestant'}
          </Button>
        )}
      </div>
    </div>
  )
}
