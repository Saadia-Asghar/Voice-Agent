# BenchDial — Hack-Nation submission copy

## Project title

BenchDial — Voice Negotiation for Laboratory Repairs

## Short description

BenchDial turns one verified lab-repair brief into comparable voice negotiations, evidence-linked quotes, and a human-approved recovery decision.

## 1. Problem & Challenge

When a laboratory instrument fails, the real repair price is usually trapped in phone calls. A lab operations lead must repeat the same fault description to multiple providers, then compare offers that hide call-out fees, calibration, warranty, parts, response time, and exclusions. The lowest quoted price can delay the lab or omit essential work. BenchDial addresses the Negotiator challenge by calling, comparing, and negotiating in this phone-priced B2B market.

## 2. Target Audience

BenchDial is for laboratory operations leads, research managers, and procurement reviewers responsible for restoring failed scientific equipment quickly. They need a fair, comparable repair decision without spending hours repeating a technical brief or trusting an incomplete phone quote.

## 3. Solution & Core Features

BenchDial has the three required stages. The Estimator combines a voice interview and a service-report document into one confirmed ScopePrint. The Caller gives the identical scope to three distinct provider styles, extracts itemized terms, and records quote, callback, or decline outcomes. The Closer checks leverage against verified evidence, negotiates fees or warranty without inventing a bid, detects suspiciously low offers, and ranks every option using both cash cost and downtime impact. The Award Memo links the recommendation back to call evidence for human review.

## 4. Unique Selling Proposition

BenchDial is not a generic voice wrapper. Its differentiator is the evidence chain: one locked ScopePrint, the same terms requested from each provider, a no-bluff leverage firewall, a before/after Concession Ledger, and a downtime-adjusted decision. The product does not merely find the lowest price; it explains which repair plan restores the bench fastest with the required coverage. The name is a pitch hook: when the bench breaks, BenchDial.

## 5. Implementation & Technology

React and TypeScript power the product workflow. ElevenLabs Agents handle voice intake and Buyer/Closer conversations. Supabase Auth protects live workspaces; Edge Functions issue short-lived conversation tokens, validate agent tools, and verify post-call webhooks. PostgreSQL stores scopes, call provenance, transcripts, and evidence. Deterministic TypeScript normalizes quotes, applies the 30-percent suspicious-low red-flag rule, and ranks recovery choices. Vercel serves the application.

## 6. Results & Impact

BenchDial converts a fragmented phone process into a reviewable recovery decision: the lab describes the job once, providers answer a comparable brief, hidden commercial terms become visible, and the operations lead receives a recommendation with receipts. The prototype has automated tests for the scope, ranking, outcome, and guardrail contracts. For final challenge evidence, the team will show three consenting live voice sessions and one genuine leverage-caused concession.

## Most fun moment

The most fun moment was seeing the “cheapest” offer stop looking like the winner when the downtime and calibration requirements were made visible. It captured the whole reason BenchDial exists: a phone quote is not a decision until the hidden assumptions are on the table.

## Suggested tags

ElevenLabs, Voice AI, React, TypeScript, Supabase, Vercel, Procurement, Laboratory Operations, Negotiation, Responsible AI

## Live project URL

https://hacknation-lemon.vercel.app

## GitHub repository URL

https://github.com/Saadia-Asghar/Voice-Agent
