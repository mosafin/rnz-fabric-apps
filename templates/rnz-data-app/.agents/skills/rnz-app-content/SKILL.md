---
name: rnz-app-content
description: >
  How every visible word in a Ricoh NZ (RNZ) Fabric app is written: screen titles,
  labels, buttons, filters, empty, loading and error states, tooltips, numbers and
  data notes, in NZ English with RNZ evidence rules. Use this whenever you write or
  change any text a person will see in an RNZ app, including chart titles, column
  headers, status labels and confirmation messages, even small ones.
---

# RNZ app content

Words in an app are interface, not marketing. They should tell people what they're looking at and what to do next, in as few plain words as possible. These rules come from the RNZ writing standards and the brand guide's Close, Active and Unlimited principles.

## Voice

- **Close:** plain, warm, honest. Say what's unknown. No jargon unless the audience uses it daily.
- **Active:** verb-led, from the reader's point of view. "Download the report", not "Report download".
- **Unlimited:** simple and confident. No hype, no superlatives, no exclamation marks.

## House style

| Rule | Do | Don't |
|---|---|---|
| NZ English | colour, organisation, analyse, centre, programme, licence (noun) | color, organization |
| Sentence case | Open opportunities by stage | Open Opportunities By Stage, OPEN OPPORTUNITIES |
| No eyebrows | Title, then metadata below it | A small label above the title |
| No em or en dashes | Rewrite the sentence, or use a comma or colon | Long dashes between phrases |
| Numbers | Use the semantic model's format string. 1,250 and $1.2m. Dates as 2 Oct 2026 | Raw floats, US dates |
| Names | Roles, not people: "the content owner", "the pillar lead" | Colleague names in labels, samples or empty states |
| Company | Ricoh New Zealand Limited, or Ricoh NZ | Ricoh NZ Pte Ltd |
| Cybersecurity | One word | cyber security |
| Tagline | imagine. change. (exactly) | Imagine Change |

## Pattern library

| Element | Pattern | Example |
|---|---|---|
| Screen title | What it is, 2 to 5 words | Content register |
| Description | What it's for, one sentence | Every content piece, its folder and its status. |
| Meta line | Source and freshness | Data as at 2 Oct 2026, 9:00am |
| Chart title | What it shows | Value by month |
| Button | Verb plus object, says what happens | Open folder, Send the request, Download as CSV |
| Neutral button | Plain action | Cancel, Back, Clear filters |
| Filter label | The field name | Pillar, Status, Owner |
| Empty state | Why, then what to try | No items match these filters. Clear the filters or choose another pillar. |
| Loading | Name the thing, or say nothing | Loading the register |
| Error | What happened, what to do, then the real error text | We couldn't load this data. Check your access to the model, then try again. |
| Success | What changed | Saved. Your changes are live. |
| Confirmation | The consequence | Retire this offer? Its folder moves to Legacy Reference. Nothing is deleted. |
| Tooltip | One short sentence | Shows only items marked required |

Never use "Click here", "Submit", "Learn more" alone, "Oops", or blame the user.

## Evidence rules for anything shown as fact

The app shows live data, so the risk is in labels and notes around it.

- Never invent, round up or add figures, targets, benchmarks or "industry average" lines that aren't in the model.
- Name the data's limits plainly when they matter: "Shows recorded conversions. Tracking setup should be confirmed before treating zero as no activity."
- If a measure's meaning is ambiguous, ask, or show its description from the model. Don't guess a friendlier name that changes its meaning.
- Third-party status (partners, certifications, product availability) in app text needs a confirmed source. Otherwise leave it out.

## Accessibility in words

- Every input has a visible label. Placeholders are examples, never labels.
- Error messages say how to fix the problem and sit next to the field.
- Icon-only buttons get an `aria-label` that matches a visible tooltip.
- Link text makes sense out of context.

## Quick self-edit

Before finishing, read every new string once and cut: filler ("simply", "just", "easily", "seamless", "robust", "leverage", "unlock"), hedging stacks, and any sentence that repeats the title. If a label needs a paragraph to explain it, rename the thing instead.
