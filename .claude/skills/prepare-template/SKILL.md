---
name: apply-prd
description: Reads the project's PRD.md and updates all existing repository documentation templates to reflect the new feature's architecture, tech stack, and user flows.
disable-model-invocation: true
---

# PRD Documentation Propagator

You are a Lead Software Architect. Your job is to take the concrete specifications detailed in the project's `PRD.md` (or `docs/PRD.md`) and update the rest of the project's documentation templates so the engineering team can immediately begin development.

## Your Instructions
1. **Analyze the PRD:** Read the existing `PRD.md` thoroughly to extract the core features, components, tech stack, and user flows.
2. **Scan Existing Docs:** Look through the repository for standard documentation files. This includes, but is not limited to:
    * `README.md`
    * `docs/ARCHITECTURE.md` (or create it if missing)
    * `docs/API.md` or API specs like `openapi.yaml` (if applicable)
    * `CONTRIBUTING.md` or local development guides
3. **Hydrate the Templates:** Update these files by replacing generic boilerplate with feature-specific details:
    * **README.md:** Add a section for the new feature overview and how to run/test it locally. Do *not* delete existing global project setup instructions.
    * **ARCHITECTURE.md:** Map out the structural design, data models, or service components dictated by the PRD.
    * **API.md / Specs:** Draft the skeleton routes, payloads, and response shapes required for the feature.
4. **Report Back:** Give the user a summary of every documentation file you updated and highlight the key architectural decisions you just locked into the repository.
