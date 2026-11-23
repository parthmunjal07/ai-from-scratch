const TEST_SUITE = [
   {
      name: "Persona: Technical Writer",
      pattern: "persona",
      variables: {
         role: "a senior technical writer at Stripe",
         experience: "10 years of API documentation experience",
         style: "precise, concise, and example-driven",
         priority: "clarity over comprehensiveness",
         task: "Explain what an API rate limit is and why it exists.",
      },
      criteria: {
         max_words: 200,
         required_keywords: ["rate limit", "API", "requests"],
         forbidden_phrases: ["in conclusion", "it is important to note"],
      },
   },
   {
      name: "Few-Shot: Sentiment Analysis",
      pattern: "few_shot",
      variables: {
         examples: `Input: "The food was amazing but service was slow"
Output: {"sentiment": "mixed", "food": "positive", "service": "negative"}

Input: "Terrible experience, never coming back"
Output: {"sentiment": "negative", "food": null, "service": "negative"}`,
         input: "Great ambiance and the pasta was perfect, though a bit pricey",
      },
      criteria: {
         expected_format: "json",
         required_keywords: ["sentiment"],
      },
   },
   {
      name: "Chain-of-Thought: Math Problem",
      pattern: "chain_of_thought",
      variables: {
         problem: "A store offers 20% off all items. An item originally costs $85. There is also a $10 coupon. Which saves more: applying the discount first then the coupon, or the coupon first then the discount?",
      },
      criteria: {
         required_keywords: ["discount", "coupon", "$"],
         max_words: 300,
      },
   },
   {
      name: "Template Fill: Resume Extraction",
      pattern: "template_fill",
      variables: {
         text: "John Smith is a software engineer at Google with 5 years of experience. He graduated from MIT with a BS in Computer Science in 2019. He specializes in distributed systems and Go programming.",
         template_structure: `Name: [full name]
                              Company: [current employer]
                              Years of Experience: [number]
                              Education: [degree, school, year]
                              Specialties: [comma-separated list]`,
      },
      criteria: {
         required_keywords: ["John Smith", "Google", "MIT"],
      },
   },
   {
      name: "Guardrail: Scoped Assistant",
      pattern: "guardrail",
      variables: {
         role: "Python programming tutor",
         domain: "Python programming",
         additional_rules: "Do not write complete solutions. Guide the student with hints.",
         question: "How do I sort a list of dictionaries by a specific key?",
      },
      criteria: {
         required_keywords: ["sorted", "key", "lambda"],
         forbidden_phrases: ["here is the complete solution"],
      },
   },
];

export function runTestSuite() {
   console.log("=".repeat(70));
   console.log("  PROMPT ENGINEERING TEST SUITE");
   console.log("=".repeat(70));

   const allResults = [];

   for (const test of TEST_SUITE) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`  Test: ${test.name}`);
      console.log(`  Pattern: ${test.pattern}`);
      console.log("=".repeat(60));

      const prompt = buildPrompt(test.pattern, test.variables);

      console.log(`\n  System: ${prompt.system.slice(0, 80)}...`);
      console.log(`  User prompt: ${prompt.user.slice(0, 120)}...`);
      console.log(`  Temperature: ${prompt.temperature}`);

      const results = runPromptTest(prompt);
      const [comparison, ranked] = compareModels(results, test.criteria);

      console.log(
         `\n  ${"Model".padEnd(25)} ${"Score".padStart(8)} ${"Tokens".padStart(8)} ${"Latency".padStart(10)}`
      );
      console.log(`  ${"-".repeat(55)}`);

      for (const [modelName, data] of ranked) {
         const score = data.scores.composite_score;
         const tokens = data.tokens.total ?? 0;
         const latency = data.latency_ms;

         console.log(
            `  ${modelName.padEnd(25)} ${score.toFixed(3).padStart(8)} ${String(tokens).padStart(8)} ${String(latency).padStart(8)}ms`
         );
      }

      allResults.push({
         test: test.name,
         pattern: test.pattern,
         rankings: ranked.map(([name, data]) => [
            name,
            data.scores.composite_score,
         ]),
      });
   }

   console.log(`\n\n${"=".repeat(70)}`);
   console.log("  SUMMARY: MODEL RANKINGS ACROSS ALL TESTS");
   console.log("=".repeat(70));

   const modelWins = {};

   for (const result of allResults) {
      if (result.rankings.length > 0) {
         const winner = result.rankings[0][0];
         modelWins[winner] = (modelWins[winner] || 0) + 1;
      }
   }

   const sortedWins = Object.entries(modelWins).sort(
      ([, a], [, b]) => b - a
   );

   for (const [model, wins] of sortedWins) {
      console.log(
         `  ${model}: ${wins} wins out of ${allResults.length} tests`
      );
   }

   return allResults;
}