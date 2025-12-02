import { Ollama } from "ollama"

interface EvaluationRequest {
    codeSnippet: string
    language: string
    description?: string
}

interface EvaluationResult {
    score: number
    strengths: string[]
    improvements: string[]
    fullReport: string
}

export async function evaluateCodeWithAI(request: EvaluationRequest): Promise<EvaluationResult> {
    // Check for Mock Mode
    if (process.env.USE_MOCK_AI === "true") {
        console.log("Using Mock AI Mode")
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        return {
            score: 85,
            strengths: [
                "Good understanding of the core concepts.",
                "Clean and readable code structure.",
                "Correct implementation of the requested logic.",
            ],
            improvements: [
                "Consider adding error handling for edge cases.",
                "Could optimize performance by reducing redundant operations.",
                "Add comments to explain complex logic.",
            ],
            fullReport: `## Detailed Analysis

### Code Quality
The submitted code demonstrates a solid grasp of the fundamentals. The structure is logical, and variable names are descriptive, making the code easy to follow.

### Logic & Correctness
The core logic appears to be correct and addresses the problem statement. The use of standard libraries is appropriate.

### Performance
While the solution works, there are opportunities for optimization. Specifically, the loop structure could be refined to reduce time complexity in large datasets.

### Security
No major security vulnerabilities were detected, but input validation should be strengthened to prevent potential injection attacks or crashes from malformed data.

### Final Verdict
A strong submission that meets the requirements. With minor refinements in error handling and optimization, this would be production-ready code.`,
        }
    }

    try {
        console.log("Starting AI evaluation with Ollama (Direct) for language:", request.language)

        const modelName = process.env.OLLAMA_MODEL || "llama3"
        const ollama = new Ollama({ host: process.env.OLLAMA_HOST || "http://127.0.0.1:11434" })

        console.log("Using Ollama model:", modelName)

        const prompt = `You are an expert code reviewer. Evaluate the following ${request.language} code and provide detailed feedback.

Code:
\`\`\`${request.language}
${request.codeSnippet}
\`\`\`

${request.description ? `Additional context: ${request.description}` : ""}

Please provide your evaluation in the following JSON format:
{
  "score": <number between 0-100>,
  "strengths": [<list of strengths as strings>],
  "improvements": [<list of improvement suggestions as strings>],
  "fullReport": "<detailed analysis>"
}

Be specific and constructive. Focus on code quality, efficiency, readability, and best practices. Return ONLY the JSON.`

        console.log("Calling Ollama API...")
        const response = await ollama.generate({
            model: modelName,
            prompt: prompt,
            format: "json", // Force JSON mode if supported, or just rely on prompt
            stream: false,
        })

        const text = response.response
        console.log("AI response received, parsing...")
        console.log("Raw response:", text.substring(0, 200) + "...")

        // Parse the response
        // Even with format: 'json', sometimes it might wrap it or add text, but usually it's clean JSON.
        // We'll still use the regex matcher to be safe.
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            console.error("No JSON found in response")
            throw new Error("Failed to parse AI response - no JSON found")
        }

        console.log("JSON match found, parsing...")
        const result = JSON.parse(jsonMatch[0]) as EvaluationResult

        // Validate the response
        if (!result.score || !Array.isArray(result.strengths) || !Array.isArray(result.improvements)) {
            console.error("Invalid result format:", result)
            throw new Error("Invalid evaluation result format")
        }

        console.log("Evaluation completed successfully:", result.score)
        return result
    } catch (error) {
        console.error("AI evaluation error details:", error)
        // @ts-ignore
        console.error("Error message:", error.message)

        throw error
    }
}
