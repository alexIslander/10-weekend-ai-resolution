# Screen flows

## Definitions
- Admin-only list: only authorized admins can see the completed list.
- Purchaser-only list: only purchasers can see their own completed reveals.

## Current flow
```mermaid
flowchart TD
  Landing[Landing] --> Purchase[Purchase]
  Purchase --> Dashboard[Dashboard]
  Dashboard --> Quiz[Quiz]
  Quiz --> Reveal[Reveal]
  Admin[Admin] --> AdminQuestions[Question editor]
  Admin --> AdminCoupons[Coupons & flags]
```

## Planned flow with question set selection
```mermaid
flowchart TD
  Landing[Landing] --> SelectSet[Select question set]
  SelectSet --> Purchase[Purchase]
  Purchase --> Dashboard[Dashboard]
  Dashboard --> Share[Magic link + share]
  Share --> QuizIntro[Quiz welcome screen]
  QuizIntro --> Quiz[Quiz]
  Quiz --> Reveal[Reveal]
  Admin[Admin] --> AdminQuestions[Question editor]
  Admin --> AdminCoupons[Coupons & flags]
```

## Option B flow (selection after purchase)
```mermaid
flowchart TD
  Landing[Landing] --> Purchase[Purchase]
  Purchase --> SelectSet[Select question set]
  SelectSet --> Dashboard[Dashboard]
  Dashboard --> Share[Magic link + share]
  Share --> QuizIntro[Quiz welcome screen]
  QuizIntro --> Quiz[Quiz]
  Quiz --> Reveal[Reveal]
```

## Share options (feature flag)
```mermaid
flowchart TD
  Dashboard[Dashboard] --> SharePanel[Magic link panel]
  SharePanel --> Copy[Copy link]
  SharePanel --> ShareButton[Share button]
  SharePanel --> EmailSection[Expandable email send]
  EmailSection --> Send[Send link]
  Send --> Confirm[Confirmation message]
```

## Dashboard status updates
- Dashboard polls for reveal completion.
- Completed reveals lock the quiz link and prompt a new purchase.

## Recipient flow (magic link)
```mermaid
flowchart TD
  Open[Open magic link] --> Welcome[Welcome screen]
  Welcome --> Quiz[Quiz questions]
  Quiz --> Submit[Submit answers]
  Submit --> Goodbye[Goodbye + confirmation + optional feedback]
```

## Post-reveal loop
```mermaid
flowchart TD
  Reveal[Reveal] --> ClosedLink[Link closed]
  ClosedLink --> NewReveal[Start new reveal]
  NewReveal --> Purchase[Purchase]
```

## Admin-only completed list
```mermaid
flowchart TD
  Admin[Admin] --> CompletedList[Completed quizzes list]
  CompletedList --> Reveal[Reveal details]
```

## Purchaser-only completed list
```mermaid
flowchart TD
  Dashboard[Dashboard] --> CompletedList[My completed quizzes]
  CompletedList --> Reveal[Reveal details]
```
