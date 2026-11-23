import { build_prompt } from "./builder.js";
import { run_prompt_test } from "./harness.js";
import { PROMPT_PATTERNS } from "./prompts-patterns.js";
import { runTestSuite } from "./test_suite.js";


function runPatternCatalogDemo() {
   console.log("=".repeat(70));
   console.log("  PROMPT PATTERN CATALOG");
   console.log("=".repeat(70));

   for (const [name, pattern] of Object.entries(PROMPT_PATTERNS)) {
      console.log(`\n  [${name}] ${pattern.name}`);
      console.log(`    ${pattern.description}`);
      console.log(`    Variables: ${pattern.variables.join(", ")}`);
      console.log(`    Recommended temp: ${pattern.temperature}`);
   }
}

function runSinglePromptDemo() {
   console.log(`\n${"=".repeat(70)}`);
   console.log("  SINGLE PROMPT BUILD + TEST");
   console.log("=".repeat(70));

   const prompt = build_prompt("persona", {
      persona: "helpful devops tutor",
      role: "a senior DevOps engineer at Netflix",
      experience: "8 years of infrastructure automation",
      style: "direct and practical",
      priority: "reliability over speed",
      task: "Explain why container orchestration matters for microservices.",
   });

   console.log(`\n  System message:\n    ${prompt.system}`);
   console.log(`\n  User message:\n    ${prompt.user.slice(0, 200)}...`);
   console.log(`\n  Temperature: ${prompt.temperature}`);
   console.log(
      `\n  Pattern metadata: ${JSON.stringify(prompt.metadata, null, 4)}`
   );

   const results = run_prompt_test(prompt);

   for (const [model, result] of Object.entries(results)) {
      console.log(`\n  [${model}]`);
      console.log(`    Response: ${result.response.slice(0, 100)}...`);
      console.log(`    Tokens: ${JSON.stringify(result.tokens)}`);
      console.log(`    Latency: ${result.api_latency_ms}ms`);
   }
}

// Entry point
runPatternCatalogDemo();
runSinglePromptDemo();
runTestSuite();