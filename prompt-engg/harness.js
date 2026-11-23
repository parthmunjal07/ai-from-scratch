/*
   - this file is a small harness code
   - by harness we mean using this code we can simulate the LLM calls and get the response in a structured format
   - this is useful for testing and debugging the prompt engineering code without actually calling the LLM APIs
   - this is also useful for benchmarking the prompt engineering code without actually calling the LLM APIs
*/

import crypto from 'node:crypto'

const MODEL_CONFIGS = {
    "gpt-4o": {
        "provider": "openai",
        "model": "gpt-4o",
        "max_tokens": 2048,
        "context_window": 128_000,
    },
    "claude-3.5-sonnet": {
        "provider": "anthropic",
        "model": "claude-sonnet-5",
        "max_tokens": 2048,
        "context_window": 1_000_000,
    },
    "gemini-1.5-pro": {
        "provider": "google",
        "model": "gemini-2.5-pro",
        "max_tokens": 2048,
        "context_window": 1_000_000,
    },
}

function format_openai_request(prompt) {
   return {
      "model": MODEL_CONFIGS["gpt-4o"]["model"],
      "messages": [
         {"role": "system", "content": prompt["system"]},
         {"role": "user", "content": prompt["user"]}
      ],
      "temperature": prompt["temperarture"]
   }
}

function format_anthropic_request(prompt) {
   return {
      "model" : MODEL_CONFIGS["claude-3.5-sonnet"]["model"],
      "system" : prompt["system"],
      "messages" : [
         {"role": user, "content": prompt["user"]},
      ],
      "temperature" : prompt["temperature"],
      "max_tokens" : MODEL_CONFIGS["claude-3.5-sonnet"]["max_tokens"]
   }
}

function format_google_request(prompt) {
   return {
      "model" : MODEL_CONFIGS["gemini-1.5-pro"]["model"],
      "contents" : [
         {"role": "user", "parts": [{"text" : `${prompt['system']}\n\n${prompt['user']}`}]}
      ],
      "generationConfig" : {
         "temperature": prompt["temperature"],
         "maxOutputTokens": MODEL_CONFIGS["gemini-1.5-pro"]["max_tokens"],
      }
   }
}

const FORMATTERS = {
   "openai" : format_openai_request,
   "google" : format_google_request,
   "anthropic": format_anthropic_request
}

async function simulateLlmCall(modelName, request) {
   await new Promise(resolve => setTimeout(resolve, 10))

   const promptHash = crypto
      .createHash("md5")
      .update(JSON.stringify(
         Object.fromEntries(
            Object.entries(request).sort(([a], [b]) => a.localeCompare(b))
         )
      ))
      .digest("hex")
      .slice(0,8)
   
      const simulatedResponses = {
         "gpt-4o": {
            response: `[GPT-4o response for prompt ${promptHash}] This is a simulated response demonstrating the model's output style. GPT-4o tends to be thorough and well-structured.`,
            tokens_used: {
               prompt: 150,
               completion: 45,
               total: 195
            },
            latency_ms: 850,
            finish_reason: "stop"
         },
         "claude-3.5-sonnet": {
            response: `[Claude-3.5-Sonnet response for prompt ${promptHash}] This is a simulated response showcasing Claude's reasoning capabilities. Claude-3.5-Sonnet often provides detailed explanations.`,
            tokens_used: {
               prompt: 140,
               completion: 50,
               total: 190
            },
            latency_ms: 900,
            finish_reason: "stop"
         },
         "gemini-1.5-pro": {
            response: `[Gemini-1.5-Pro response for prompt ${promptHash}] This is a simulated response illustrating Gemini's concise and informative style. Gemini-1.5-Pro is known for its clarity.`,
            tokens_used: {
               prompt: 130,
               completion: 55,
               total: 185
            },
            latency_ms: 800,
            finish_reason: "stop"
         }
      }
   return simulatedResponses[modelName] || {
      response: "unknown model",
      tokens_used: {},
      latency_ms: 0,
   }
}

export function run_prompt_test(prompt, models = null) {
   if (models === null) {
      models = Object.keys(MODEL_CONFIGS);
   }

   const results = {};

   for (const modelName of models) {
      const config = MODEL_CONFIGS[modelName];
      const formatter = FORMATTERS[config.provider];
      const request = formatter(prompt);

      const start = performance.now();
      const response = simulateLlmCall(modelName, request);
      const wallTime = performance.now() - start;

      results[modelName] = {
         response: response.response,
         tokens: response.tokens_used,
         api_latency_ms: response.latency_ms,
         wall_time_ms: Math.round(wallTime * 10) / 10,
         finish_reason: response.finish_reason ?? null,
         request_payload: request,
      };
   }

   return results;
}
