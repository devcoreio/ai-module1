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


_______

- Prompt: Read all the files contained within the config-service folder, then suggest various improvements that could make the API more useful for users. Provide me with several options and give me an option to choose one. Then create a prompt that will be an effective plan for ensuring implemented correctly and efficiently and record this in @/prompts/4-web-api-enhancement
- Mode: Plan
- Context: Clean
- Model:  anthropic/claude-3.7-sonnet
- Input: config-service files
- Output: prompts/4-web-api-enhancement
- Cost: 33.1K Tokens (.40 usd)
- Reflections:
- - It found that the specific api and has detailed the model - what hash to provide etc. cool!
- - I feel like I would want to spend more time understanding its plan so i can more effectively judge later implementation steps.
- - It mentioned a TTL Cache for the breach results to reduce API calls - not sure that this came through in the final prompt.


________

- Prompt: Please make changes to the API Service defined in the `config-service` folder, according to the Implementation Plan defined in @/prompts/4-web-api-enhancement
- Mode: Act
- Context: Clean
- Model: anthropic/claude-3.7-sonnet
- Input: prompts/4-web-api-enhancement
- Output: config-service
- Cost: 111.7K (2.03 usd)
- Reflections:
- - Failed integration tests - looks like it may have forgotten to update the tests...
- - Forgot to implement updates for readme, .. I think il need to check on it more throughly before committing.


______


- Prompt: Read @prompts/5-web-user-ui-prompt.md and follow the instructions at the top of the file.
- Tool: Cline
- Mode: Plan
- Context: Clean
- Model: Claude 3.7 Sonnet
- Input: prompts/5-web-user-ui-prompt.md
- Output: prompts/6-web-user-ui-plan.md
- Cost: 30K tokens (.27 usd)
- Reflections: 
- - encouraged to ask questions and it did
- - - Single page/multipage
- - - specific color palate
- - - specific features
- - - custom animations?
- - - preference on hosting deployment
- - Keeps naming things "password configuration". This signals to me an incorrect perception on what im trying to create and only can get that from the naming confention of the 'config-service' - I might need to be considerate of this in the future.


________


 - Prompt: Read @prompts/6-web-user-ui-plan.md and follow the instructions at the top of the file.
- Tool: Cline
- Mode: Act
- Context: Clean
- Model: Claude Sonnet 4
- Input: prompts/6-web-user-ui-plan.md
- Output: ui/
- Costs: $2.31
- Reflections:
- - Didn't have specific instructions at the top of the file and it mentioned it didnt see it. My fault.
- - Had issues in the password-oinpout.test.ts that it didn't pick up before it was finished 
- - Didn't test it before finishing - attempted to by the looks but stopped when python was not found


________


 - Prompt: There seems to be an issue on `@ui/tests/unit/password-input.test.ts` - are you able to identify and fix this issue?
- Tool: Cline
- Mode: Act
- Context: Clean
- Model: Claude Sonnet 4
- Input: @ui/tests/unit/password-input.test.ts
- Output: @ui/tests/unit/password-input.test.ts
- Costs: 24.4k (0.38usd)
- Reflections:
- - seemed to resolve issue


________


 - Prompt: Please create a .gitignore file within `@ui/` folder and compile and run the front and backend locally so I can verify that the frontend is working
- Tool: Cline
- Mode: Act
- Context: Clean
- Model: Claude Sonnet 4
- Input: @ui/
- Output: .gitignore
- Costs: 23.8K tokens (0.5638)
- Reflections:
- - Paused on getting the backend runnning so i cancelled
- - THis is more expensive than creating a .gitignore should be - mistake to give these 2 seperate tasks



________


 - Prompt: Please Compile and run the frontend (`@ui/`) and backend (`@config-service/`) locally so I can verify that the frontend is working
- Tool: Cline
- Mode: Act
- Context: Clean
- Model: Claude Sonnet 4
- Input: @ui/ & @config-service
- Output: local run instances
- Costs: 19K tokens (0.2208 usd)
- Reflections:
- - Seems to have ran both front and backend - not sure that everything is working as it seems the inputbox on the frontend ui isn't working


________


- Prompt: There seems to be an issue with inputing the password on the frontend ui `@ui/`. Please help me identify the issue and fix it.
- Tool: Cline
- Mode: Act
- Context: Clean
- Model: Claude Sonnet 4
- Input: @ui
- Output: tsconfig.json
- Costs: 45.9k ($0.8105)
- Reflections:
- - Not specific enough with the issue - should have given some clue (ie. "text input not working")
- - Compiled the TS but still not working 
