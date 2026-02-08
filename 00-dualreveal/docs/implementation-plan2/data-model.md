# Data model updates

## New entities
- `question_sets`
  - `id`, `key`, `title`, `description`, `type`
- `question_options`
  - `id`, `question_id`, `label`, `value`, `sort_order`

## Changes
- `questions`
  - add `question_set_id`
  - add `answer_type` (text | single)
- `reveals`
  - add `question_set_id`
  - add `quiz_started_at`
  - add `quiz_locked_by` (session or device id)
- `answers`
  - add `selected_option_id` for single-select answers

## Required behavior
- Persist selected question set on reveal creation or selection step.
- Persist quiz start timestamp and lock owner to prevent multiple sessions.
- Enforce one completed submission per reveal.
