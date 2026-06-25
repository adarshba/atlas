export type PlannerAction = 'respond' | 'use_tool' | 'retrieve_memory' | 'store_memory' | 'wait'

export type Plan = {
  readonly id: string
  readonly sessionId: string
  readonly actions: readonly PlannerStep[]
  readonly createdAt: Date
}

export type PlannerStep = {
  readonly id: string
  readonly action: PlannerAction
  readonly toolName: string | null
  readonly toolInput: unknown
  readonly reasoning: string
  readonly completed: boolean
}

export type PlannerDecision = {
  readonly shouldRespond: boolean
  readonly shouldUseTools: boolean
  readonly toolsRequired: readonly string[]
  readonly reasoning: string
  readonly estimatedSteps: number
}

export type Observation = {
  readonly sessionId: string
  readonly messageText: string
  readonly platform: string
  readonly userId: string
  readonly timestamp: Date
  readonly context: PlannerContext
}

export type PlannerContext = {
  readonly recentMessages: readonly string[]
  readonly relevantFacts: readonly string[]
  readonly activeTools: readonly string[]
}
