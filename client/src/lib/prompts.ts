/**
 * Fills a prompt template's {{input_N}} variables with upstream box outputs.
 * Also supports {{inputs}} which concatenates all inputs labeled.
 *
 * @param template The prompt template string
 * @param inputs Array of upstream box outputs (ordered by edge)
 * @returns The filled prompt string
 */
export function fillPromptTemplate(
  template: string,
  inputs: string[]
): string {
  let filled = template;

  // Replace {{input_N}} with the Nth input (1-indexed)
  filled = filled.replace(/\{\{input_(\d+)\}\}/g, (_match, num) => {
    const idx = parseInt(num, 10) - 1;
    return inputs[idx]?.trim() || "[no input]";
  });

  // Replace {{input}} as alias for {{input_1}}
  filled = filled.replace(/\{\{input\}\}/g, () => {
    return inputs[0]?.trim() || "[no input]";
  });

  // Replace {{inputs}} with all inputs labeled and concatenated
  filled = filled.replace(/\{\{inputs\}\}/g, () => {
    if (inputs.length === 0) return "[no inputs]";
    return inputs
      .map((inp, i) => `Input ${i + 1}:
${inp.trim()}`)
      .join("\n\n---\n\n");
  });

  return filled;
}

/**
 * Returns the output text from a box — generated output for AI boxes,
 * or user content for idea boxes.
 */
export function getBoxOutput(output: string, content: string): string {
  return output || content;
}