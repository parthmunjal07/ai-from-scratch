function score_response(response_text, criteria) {
   scores = {}

   if (criteria.includes("max_words")) {
      const word_count = length(response_text.split())
      scores["word_count"] = word_count
      scores["length_compliant"] = word_count <= criteria["max_words"]
   }

   if (criteria.includes("required_keywords")) {
      const found = criteria["required_keywords"].filter(kw => response_text.toLowerCase().includes(kw.toLowerCase()))
      scores["keywords_found"] = found
      scores["keyword_coverage"] = criteria["required_keywords"].length > 0 ? length(found) / length(criteria["required_keywords"]) : 1.0
   }

   if (criteria.includes("forbidden_phrases")) {
      const violations = criteria["forbidden_phrases"].filter(fp => response_text.toLowerCase().includes(fp.toLowerCase()))
      scores["forbidden_violations"] = violations
      scores["no_violations"] = length(violations) == 0
   }

   if (criteria.includes("expected_output")) {
      const fmt = criteria["expected_format"]
      if (fmt === 'json') {
         try {
            JSON.parse(response_text)
            scores["format_valid"] = true
         } catch (error) {
            scores.format_valid = false
         }
      } else if (fmt == "bullet_points") {
         const lines = response_text
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0)
            
         const bullet_lines = lines.filter(
            l => l.startsWith("-") || l.startsWith("*") || l.startsWith("1")
         )

         scores["format_valid"] = length(bullet_lines) >= length(lines) * 0.5
      } else if ("numbered_list") {
         const numbered = response_text.match(/^\d+\./gm) || []
         scores["format_valid"] = length(numbered) >= 2
      } else {
         scores["format_valid"] = true
      }
   }

   const total = 0
   const count = 0

   for (const [key, value] of Object.entries(scores)) {
      if (typeof value === "boolean") {
         total += value ? 1.0 : 0.0
         count += 1
      } else if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1) {
         total += value
         count += 1
      }
   }

   if (count > 0) {
      scores["composite_score"] = Math.round(total / count, 3)
   } else {
      scores["composite_score"] = 0.0
   }

   return scores
}

function compare_models(test_results, criteria) {
   const comparison = {}
   for (const [model_name, result] of Object.entries(test_results)) {
      scores = score_response(result[response], criteria)
      comparison[model_name] = {
         "scores": score_response(result["response"], criteria),
         "tokens": result["tokens"],
         "latency_ms": result["api_latency_ms"],
      }
   }
   const ranked = Object.entries(comparison).sort(
      ([, a], [, b]) => b.scores.composite_score - a.scores.composite_score
   ) 
   return [comparison, ranked]
}