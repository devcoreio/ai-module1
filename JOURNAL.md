- Prompt (what we're asking of our assistant): Read @/prompts/1-web-api-specs.md and follow the instructions at the top of the file.
- Tool (our AI assistant): Cline
- Mode (plan, act, etc.): Plan
- Context (clean, from previous, etc.): Clean
- Model (LLM model and version): kat-coder-pro
- Input (file added to the prompt): prompts/1-web-api-specs.md
- Output (file that contains the response): prompts/2-web-api-prompt.md
- Cost (total cost of the full run): 12.9K Tokens (FREE)
- Reflections (narrative assessments of the response):  The AI created a prompt that looks to be a simple start point for designing an API. I only specified the lanugage and what purpose of the API should be and it created what look to be specific requirements and contstraints.

________

- Prompt: Read @/prompts/2-web-api-prompt.md and follow the instructions at the top of the file.
- Mode: Plan
- Context: Clean
- Input: prompts/2-web-api-specs.md
- Output: prompts/3-web-api-plan.md
- Cost: 15.9K Tokens (Free)
- Reflections: 
- - It makes internal notes about not adding more dependencies without explicit approval
- - - Helps me believe it wont go off the guidelines (self limiting)
- - It mentions Architectural Patterns which i know little all about
- - Makes note of not including additional dependencies beyond whats necessary 
- - It created the correct file Output without being specifically told - its reading this file?