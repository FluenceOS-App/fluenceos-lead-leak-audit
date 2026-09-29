import type { AuditQuestion } from "./types";

export const AUDIT_QUESTIONS: ReadonlyArray<AuditQuestion> = [
  {
    id: "q1",
    prompt: "When you finish a promising conversation with a potential client, how often are you clear about what happens next?",
    answers: [
      { value: 1, label: "I always know what the next step is" },
      { value: 2, label: "Usually, but not every time" },
      { value: 3, label: "Sometimes it's clear, sometimes it isn't" },
      { value: 4, label: "Often, I'm not really sure what happens next" },
    ],
  },
  {
    id: "q2",
    prompt: "If a potential client seems interested but then goes quiet, what usually happens?",
    answers: [
      { value: 1, label: "I have a follow-up planned and do it" },
      { value: 2, label: "I usually remember to check back in" },
      { value: 3, label: "I follow up when I happen to think about it" },
      { value: 4, label: "It can easily slip through the cracks" },
    ],
  },
  {
    id: "q3",
    prompt: "Where do you usually keep track of people who might become clients?",
    answers: [
      { value: 1, label: "I have one place where I keep track of them" },
      { value: 2, label: "Mostly one place, but a few end up elsewhere" },
      { value: 3, label: "They're spread across a few places like email, DMs, notes, or a spreadsheet" },
      { value: 4, label: "They're mostly wherever the conversation happened—or in my head" },
    ],
  },
  {
    id: "q4",
    prompt: "When client work gets busy, what usually happens to the things you do to keep new work coming in?",
    answers: [
      { value: 1, label: "I keep doing them consistently" },
      { value: 2, label: "I do a little less, but I still keep things moving" },
      { value: 3, label: "Most of it gets pushed aside until things calm down" },
      { value: 4, label: "I usually stop thinking about it until I need more work" },
    ],
  },
  {
    id: "q5",
    prompt: "What usually happens to people who showed interest in working with you, but the timing wasn't right?",
    answers: [
      { value: 1, label: "I have a way to remember to check back with them" },
      { value: 2, label: "I usually remember the promising ones" },
      { value: 3, label: "I reconnect if something reminds me of them" },
      { value: 4, label: "Most of them probably never hear from me again" },
    ],
  },
  {
    id: "q6",
    prompt: "Of the people you're currently talking with about working together, how many have a clear next step and a time to follow up?",
    answers: [
      { value: 1, label: "Almost all of them" },
      { value: 2, label: "Most of them, but there are a few I'm not sure about" },
      { value: 3, label: "Some do, but others are just sitting there" },
      { value: 4, label: "I'd have to go through my messages or notes to figure that out" },
    ],
  },
  {
    id: "q7",
    prompt: "After you send a proposal, what usually happens if you don't hear back?",
    answers: [
      { value: 1, label: "I already know when I'll follow up and I do it" },
      { value: 2, label: "I usually remember to check back in" },
      { value: 3, label: "I follow up when I happen to think about it" },
      { value: 4, label: "I sometimes realize later that I never followed up" },
    ],
  },
  {
    id: "q8",
    prompt: "If you sat down right now to focus on landing your next project, would you know who needs your attention first?",
    answers: [
      { value: 1, label: "Yes, I'd know exactly where to start" },
      { value: 2, label: "Mostly, though I'd need to check a couple of things" },
      { value: 3, label: "I'd need to look through messages, notes, or other places to figure it out" },
      { value: 4, label: "I'd probably have to piece it together as I went" },
    ],
  },
] as const;
