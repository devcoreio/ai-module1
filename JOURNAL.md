- Prompt (what we're asking of our assistant): Read @/prompts/1-web-api-specs.md and follow the instructions at the top of the file.
- Tool (our AI assistant): Cline
- Mode (plan, act, etc.): Act
- Context (clean, from previous, etc.): Clean
- Model (LLM model and version): kat-coder-pro
- Input (file added to the prompt): prompts/1-web-api-specs.md
- Output (file that contains the response): prompts/2-web-api-prompt.md
- Cost (total cost of the full run): 12.9K Tokens (FREE)
- Reflections (narrative assessments of the response):  The AI created a prompt that looks to be a simple start point for designing an API. I only specified the lanugage and what purpose of the API should be and it created what look to be specific requirements and contstraints.

________

- Prompt: Read @/prompts/2-web-api-prompt.md and follow the instructions at the top of the file.
- Mode: Act
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


________

- Prompt: Please create a Config API Service in the `config-service` folder, according to the Implementation Plan defined in @/prompts/3-create-web-api-plan.md
- Mode: Act
- Context: Clean
- Model: kat-coder-pro
- Input: 3-web-api-plan.md
- Output: config-service
- Cost: 103K Tokens
- Reflections: 
- - Created main.go -> once i checked it reviewed again and fixed an issue (not importing "fmt"). This seems like a fairly big oversight but glad it caught.
- - After creating the the password lenght logic it's gone back an updated function call, then renamed it back to the previous name
- - It took considerable time on the integration tests (api_test.go). Sometimes i wonder if it froze..
- - - It was. It came back and said the task was interrupted. Jumped back in automatically.
- - - - Paused again. line 216 - think it might have been the same line...
- - Docker - no docker ignore file..? not sure if needed.
- - It was testing that things work and still doesn't have a gitignore file..
- - - Once it was all finished it didnt create a gitignore -- do i need a rule around this? 
- - Found issues with non exported functions (capitilize the func). this seems like a simple thing to make sure is a rule?