"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

export function MergeGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-gray-200 bg-gray-50/50 py-0">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors rounded-t-lg">
            <span className="text-sm font-medium text-gray-700">
              How to handle the merge
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <ol className="space-y-3 text-sm text-gray-600 list-decimal list-inside">
              <li>
                Click <strong>&quot;Create tribe&quot;</strong> to create the merged tribe
                and check <strong>&quot;This is the merged tribe&quot;</strong>
              </li>
              <li>
                In the tribe assignment panel, select{" "}
                <strong>ALL remaining active contestants</strong> (use
                &quot;Select all&quot; shortcuts)
              </li>
              <li>
                Choose the <strong>merged tribe</strong> as the destination
              </li>
              <li>
                Set the <strong>week number</strong> to the merge episode
              </li>
              <li>
                Confirm — all contestants now show the merged tribe color from
                that week forward in the picks grid
              </li>
            </ol>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
