import { PROMPT_PATTERNS } from "./prompts-patterns.js";

export function build_prompt(pattern_name, variables, system_override=null) {
   const pattern = PROMPT_PATTERNS[pattern_name]
   if (!pattern) {
      throw new Error(
         `Unknown pattern: ${pattern_name}. Available: ${Object.keys(PROMPT_PATTERNS).join(", ")}`
      )
   }

   const missing = pattern.variables.filter(variable => !(variable in variables))
   if (missing.length > 0) {
      throw new Error(
         `Missing variables for ${pattern_name}: ${missing}`
      )
   }

   const rendered = pattern.template.replace(/\{(\w+)\}/g, (match, key) => {
      return String(variables[key]);
   });

   const system = system_override || `You are an AI assistant using the ${pattern['name']}.`

   return {
      "system": system,
      "user": rendered,
      "temperature": pattern["temperature"],
      "pattern": pattern_name,
      "metadata": {
         "description": pattern["description"],
         "variables_used": Object.keys(variables),
        },
    }

}

/*
   terms used above :-
      1. Temperature ("the creativity knob")
         - A scaling factor on the logit distribution before softmax -- higher values flatten 
         the distribution (more random), lower values sharpen it (more deterministic)

*/
