# FSD Studio — Output Specification

## Purpose

This document turns `reference-output/Example_Ideal_FSD_Authentication.html` into a durable, implementation-facing rendering contract. The reference remains the visual source; this file states the decisions that should be preserved and tested.

## Authority and scope

- The development workflow remains authoritative for content structure and application behaviour.
- The reference output guides presentation, navigation, and browser printing.
- It is a reference for rendering structured FSD data, not a hard-coded Authentication template or a source of product instructions.

## Screen document experience

- Show a persistent product top bar with Print / Save as PDF and return-to-top actions.
- Show a document navigation sidebar on desktop, including nested links for relevant flows, screens, and requirement groups.
- Highlight the currently visible navigation target where feasible.
- Render a centred, white document canvas against a neutral application background.
- Collapse the layout gracefully on narrow screens: document remains readable, and navigation is no longer a fixed sidebar.

## A4 rendering and print contract

- Render the document as explicit A4-oriented pages (`210mm × 297mm`) in preview mode.
- Include a cover page followed by numbered document pages.
- Use browser print CSS with A4 page size, no browser page margin, page breaks between rendered pages, and no clipped content.
- Hide application chrome and document navigation during printing.
- Prevent table rows from splitting across a printed page when supported by the browser.
- Preserve page numbers and document margins in print output.

## Visual language

- Use a restrained documentation palette: navy headings, blue accents, soft grey surfaces, white pages, and warm warning states.
- Use clear heading levels, section dividers, compact tables, callouts, tags, and muted supporting text.
- Use tables for metadata, histories, requirements, validation, traceability, and approval records.
- Show warning/TBD/not-applicable information explicitly; do not silently omit required sections.

## Required rendered content order

The full document presents: cover; document control; overview and scope; business context; actors and assumptions; then each module's nine standard sections (process flows, UI/Lo-Fi, functional requirements, business rules, data and validation, integration requirements, errors/UI states, security/NFR, acceptance criteria); cross-module traceability; open items and approvals; and API handoff checklist.

The Authentication sample expands this into document sections 1–15 and appendices. Other FSDs must use the same structured standard but need not duplicate its exact page count or content.

## Acceptance checks for renderer work

- A preview can navigate to the main sections and relevant nested artefacts.
- The cover exposes document identity, version/status, ownership, release information, and update date.
- All mandatory module sections render even when their value is `Not Applicable` or `TBD`.
- Requirements, validation, screens, flows, and acceptance criteria display their stable IDs and links where applicable.
- Printing to PDF produces legible A4 pages without the application chrome.
