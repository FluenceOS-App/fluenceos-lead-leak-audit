import type { AuditAnswers, AuditResult, Category, ImpactState } from "./types";

export type ResultVariant =
  | "default"
  | "conversation_clarity"
  | "current_visibility"
  | "combined"
  | "early_stage"
  | "proposal_stage"
  | "both_stages"
  | "structural_risk"
  | "current_leak";

export interface ResultContent {
  category: Category | null;
  variant: ResultVariant;
  title: string;
  diagnosis: string;
  whyItMatters: string;
  actions: readonly string[];
  pipelineBridge: string;
  ctaLabel: string;
}

const ACTIONS = {
  missingNextActions: [
    "Before ending a promising conversation, decide what the next step is and who owns it.",
    "Give that next step a date or follow-up point so it does not become ‘I’ll remember later.’",
    "Keep one short list of open opportunities that do not yet have a clear next action.",
  ],
  followUp: [
    "Decide when you will follow up at the same time you finish the conversation or send the proposal.",
    "Use a simple follow-up rhythm so checking back in does not depend on remembering in the moment.",
    "For proposals, set the first follow-up before you hit send.",
  ],
  scattered: [
    "Pick one place to keep the basic status of every potential client.",
    "Record only what you need to act: who they are, where things stand, and what happens next.",
    "When a new conversation starts in email, DMs, or somewhere else, add it to that one place while it is still fresh.",
  ],
  dormant: [
    "Keep a short list of people who were interested but not ready yet.",
    "Give each one a reason and approximate date to check back in.",
    "Review that list regularly so reconnecting does not depend on something randomly reminding you.",
  ],
  busy: [
    "Choose one or two small activities that keep future work moving even during busy weeks.",
    "Put those activities on a recurring schedule instead of waiting until work slows down.",
    "Keep the minimum habit intentionally small enough that you will still do it when delivery gets heavy.",
  ],
  healthy: [
    "Keep doing whatever is helping you stay clear on next steps and follow-up.",
    "Tighten the one or two weaker areas before workload or opportunity volume increases.",
    "Avoid adding more tools or process unless they actually make it easier to know what needs attention.",
  ],
} as const;

const missingNextActionsContent = {
  title: "The Next Step Isn’t Always Clear",
  whyItMatters:
    "When the next action is vague, promising conversations can stall simply because no one knows exactly what should happen next. The more conversations you’re juggling, the easier it becomes to lose momentum or spend time figuring out what you meant to do instead of actually doing it.",
  actions: ACTIONS.missingNextActions,
  pipelineBridge:
    "Pipeline OS helps keep each potential client tied to a clear next action and follow-up point, so you do not have to reconstruct what should happen every time you sit down to work on new business.",
  ctaLabel: "Make your next steps easier to see with Pipeline OS — free forever.",
} as const;

const followUpContent = {
  title: "Follow-Up Is Slipping",
  actions: ACTIONS.followUp,
  pipelineBridge:
    "Pipeline OS keeps follow-ups visible and connected to the right potential client, so checking back in does not depend on remembering at the right moment.",
  proposalPipelineBridge:
    "Pipeline OS can keep proposal follow-up visible too, so sending the proposal is not the last deliberate action you take before waiting and hoping they reply.",
  ctaLabel: "Keep your follow-ups from slipping with Pipeline OS — free forever.",
} as const;

const scatteredContent = {
  title: "Your Potential Clients Are Scattered Across Too Many Places",
  whyItMatters:
    "When conversations and details live in different places, every next action takes a little more effort. That friction may be manageable now, but it becomes much easier to miss something when workload grows or several potential clients are moving at once.",
  actions: ACTIONS.scattered,
  pipelineBridge:
    "Pipeline OS gives you one place to see who you are talking with, where things stand, and what needs attention next—without forcing you to stop using email, DMs, or wherever the conversation actually happens.",
  ctaLabel: "Bring your potential clients into one clear view with Pipeline OS — free forever.",
} as const;

const dormantContent = {
  title: "Potential Clients Are Going Cold",
  diagnosis:
    "Your answers suggest that people who showed real interest but were not ready yet are not always being brought back into the conversation. Those opportunities may not be lost because they said no—they may simply be disappearing because there is no reliable reason or reminder to reconnect.",
  whyItMatters:
    "Someone who was interested but not ready is still a possible future client. If there is no reliable way to bring them back into view, those opportunities can disappear even though the original problem was timing, not lack of interest.",
  actions: ACTIONS.dormant,
  pipelineBridge:
    "Pipeline OS helps keep interested people from disappearing just because the timing was not right. You can keep them visible, know why you planned to reconnect, and see when it is time to bring the conversation back to life.",
  ctaLabel: "Keep promising opportunities from going cold with Pipeline OS — free forever.",
} as const;

const busyContent = {
  title: "New Work Stops When Client Work Gets Busy",
  diagnosis:
    "Your answers suggest that the activities that help create future work tend to slow down or stop when current client work gets demanding. That can create the familiar busy-now, empty-later cycle because nothing is being developed behind the work you are delivering today.",
  whyItMatters:
    "If the activities that create future work stop whenever delivery gets busy, the slowdown often appears later—after the current project ends. That is how a full schedule today can turn into an empty pipeline tomorrow.",
  actions: ACTIONS.busy,
  pipelineBridge:
    "Pipeline OS helps keep the small actions that create future work visible even when client delivery takes over your week. The goal is not to ‘do more sales’—it is to stop future work from disappearing from view when you get busy.",
  ctaLabel: "Keep future work moving with Pipeline OS — free forever.",
} as const;

const healthyContent = {
  title: "Your Pipeline Looks Pretty Solid Right Now",
  diagnosis:
    "Your answers do not show a significant current leak. You appear to have a good handle on what is moving, what needs attention, and what should happen next, although there may still be one or two areas worth tightening before they create friction later.",
  whyItMatters:
    "You do not appear to have a major operational leak at the moment. The value in tightening any weaker areas now is not fixing a crisis—it is reducing the chance that more conversations, more client work, or a busier schedule creates one later.",
  actions: ACTIONS.healthy,
  pipelineBridge:
    "You do not need more process just for the sake of having more process. Pipeline OS can help you keep the clarity you already have as conversations and workload grow, without turning your business into a complicated CRM.",
  ctaLabel: "Keep your pipeline simple and visible with Pipeline OS — free forever.",
} as const;

function resolveMissingNextActionsVariant(answers: AuditAnswers): ResultVariant {
  const conversationProblem = answers.q1 >= 3;
  const visibilityProblem = answers.q6 >= 3 || answers.q8 >= 3;

  if (conversationProblem && visibilityProblem) return "combined";
  if (visibilityProblem) return "current_visibility";
  return "conversation_clarity";
}

function resolveFollowUpVariant(answers: AuditAnswers): ResultVariant {
  const earlyStageProblem = answers.q2 >= 3;
  const proposalStageProblem = answers.q7 >= 3;

  if (earlyStageProblem && proposalStageProblem) return "both_stages";
  if (proposalStageProblem) return "proposal_stage";
  return "early_stage";
}

function resolveScatteredVariant(impactState: ImpactState): ResultVariant {
  return impactState === "current_leak" ? "current_leak" : "structural_risk";
}

export function getCategoryTitle(category: Category): string {
  switch (category) {
    case "missing_next_actions":
      return missingNextActionsContent.title;
    case "follow_up":
      return followUpContent.title;
    case "scattered_leads":
      return scatteredContent.title;
    case "dormant_prospects":
      return dormantContent.title;
    case "busy_stops_business_development":
      return busyContent.title;
  }
}

export function buildPrimaryResultContent(
  answers: AuditAnswers,
  result: AuditResult,
): ResultContent {
  if (result.primaryType === "no_significant_leak" || result.primaryCategory === null) {
    return {
      category: null,
      variant: "default",
      ...healthyContent,
    };
  }

  switch (result.primaryCategory) {
    case "missing_next_actions": {
      const variant = resolveMissingNextActionsVariant(answers);
      const diagnosis =
        variant === "combined"
          ? "Your answers suggest that next steps are not always being defined clearly, and some current opportunities are becoming harder to act on later. That creates a double problem: conversations can stall, and you may have to piece together what should happen next after the fact."
          : variant === "current_visibility"
            ? "Your answers suggest that some opportunities may have a next step, but it is not always easy to see what needs attention now. That forces you to reconstruct status from messages or notes instead of simply acting on the next step."
            : "Your answers suggest that promising conversations do not always end with a clear next step. That makes it easier for momentum to fade because what should happen next is not always defined while the conversation is still fresh.";

      return {
        category: result.primaryCategory,
        variant,
        diagnosis,
        ...missingNextActionsContent,
      };
    }

    case "follow_up": {
      const variant = resolveFollowUpVariant(answers);
      const diagnosis =
        variant === "both_stages"
          ? "Your answers suggest follow-up is slipping at multiple points—from promising conversations through proposals. That means opportunities can lose momentum both early in the relationship and when they are closest to becoming paid work."
          : variant === "proposal_stage"
            ? "Your answers suggest follow-up is breaking down after proposals are sent. That is a more immediate leak because the opportunity has already progressed to the point where a potential client is actively considering working with you, but the next check-in may still depend on memory."
            : "Your answers suggest promising conversations are sometimes going quiet without a reliable plan to check back in. That means interested potential clients can lose momentum before the relationship has a chance to develop.";

      const whyItMatters =
        variant === "proposal_stage"
          ? "Once a proposal is sent, the opportunity is already well developed. If you do not have a clear follow-up plan, you can lose momentum at the point when the potential client is closest to making a decision."
          : "A potential client can be interested and still go quiet. If follow-up depends on memory, timing, or confidence in the moment, good opportunities can fade for reasons that have nothing to do with the quality of your work.";

      return {
        category: result.primaryCategory,
        variant,
        title: followUpContent.title,
        diagnosis,
        whyItMatters,
        actions: followUpContent.actions,
        pipelineBridge:
          variant === "proposal_stage"
            ? followUpContent.proposalPipelineBridge
            : followUpContent.pipelineBridge,
        ctaLabel: followUpContent.ctaLabel,
      };
    }

    case "scattered_leads": {
      const variant = resolveScatteredVariant(result.categories.scattered_leads.impactState);
      const diagnosis =
        variant === "current_leak"
          ? "Your answers suggest that potential-client information is spread across multiple places and that this is already making it harder to know who needs attention. The issue is not the specific tools you use—it is the time and effort required to piece together what is happening before you can act."
          : "Your answers suggest that potential-client information is spread across multiple places, but you are still managing to stay on top of it. That is not a major leak right now, but it can create friction as the number of conversations or workload grows.";

      return {
        category: result.primaryCategory,
        variant,
        diagnosis,
        ...scatteredContent,
      };
    }

    case "dormant_prospects":
      return {
        category: result.primaryCategory,
        variant: "default",
        ...dormantContent,
      };

    case "busy_stops_business_development":
      return {
        category: result.primaryCategory,
        variant: "default",
        ...busyContent,
      };
  }
}
