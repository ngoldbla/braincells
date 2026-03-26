export interface AutoDatasetConfig {
  datasetName: string;
  columns: Array<{ name: string; prompt: string; type: string }>;
  queries: string[];
  text: string;
}

export function processTextConfigResponse(
  text: string,
  searchEnabled = false,
): AutoDatasetConfig {
  const sectionPatterns = {
    name: /^DATASET NAME:$/i,
    columns: /^COLUMNS:$/i,
    queries: /^SEARCH QUERIES:$/i,
    bulletPoint: /^\s*-\s+(.+)$/,
    quotedText: /^["'](.+)["']$/,
  };

  let currentSection: string | null = null;

  const result: AutoDatasetConfig = {
    datasetName: 'Auto-generated Dataset',
    columns: [],
    queries: [],
    text,
  };

  for (const line of text.split('\n').map((l) => l.trim())) {
    if (!line) continue;

    if (sectionPatterns.name.test(line)) {
      currentSection = 'name';
      continue;
    }

    if (sectionPatterns.columns.test(line)) {
      currentSection = 'columns';
      continue;
    }

    if (searchEnabled && sectionPatterns.queries.test(line)) {
      currentSection = 'queries';
      continue;
    }

    if (!currentSection) continue;

    if (currentSection === 'name') {
      result.datasetName = line;
      continue;
    }

    const bulletMatch = line.match(sectionPatterns.bulletPoint);
    if (!bulletMatch) continue;

    const item = bulletMatch[1].trim();

    if (currentSection === 'columns') {
      const colonIndex = item.indexOf(':');
      if (colonIndex === -1) continue;

      const columnName = item.substring(0, colonIndex).trim();
      const promptWithType = item.substring(colonIndex + 1).trim();

      const typeMatch = promptWithType.match(/\(type:\s*(text|image)\)/i);
      const columnType = typeMatch ? typeMatch[1].toLowerCase() : 'text';

      const prompt = promptWithType
        .replace(/\(type:\s*(text|image)\)/gi, '')
        .trim();

      if (columnName) {
        result.columns.push({ name: columnName, prompt, type: columnType });
      }
    }

    if (searchEnabled && currentSection === 'queries') {
      const quotedMatch = item.match(sectionPatterns.quotedText);
      const query = quotedMatch ? quotedMatch[1] : item;
      if (query) {
        result.queries.push(query);
      }
    }
  }

  return result;
}

export const SEARCH_PROMPT_TEMPLATE = `
Given this request:

{instruction}

First, provide a short, descriptive name for this dataset (2-5 words).

Then, identify the main columns needed for this dataset.

Second, identify the prompts that would be needed to generate each cell in the column. For example, if the column is tweet, and the tweet is about a specific topic, event, or action, write: Tweet about X. If a column is related to another column, reference it using {{column_name}} in the prompt.

For image columns, specify the type as "image" and provide a descriptive prompt for image generation. Image columns are useful for:
- Product images based on descriptions
- Illustrations for stories or concepts
- Visual representations of data or concepts
- Logos or designs based on text descriptions

IMPORTANT: Do not reference image columns in the prompts for other columns.

Only propose an image column if the user request clearly asks for images, illustrations, photos, or visual content.

Then, create specific search queries that will help gather information for the entire dataset.

Your response must follow this exact format:

DATASET NAME:
Short Descriptive Name

COLUMNS:
- column_name1 : prompt1 (type: text) (this first column is always the main object and the only one not referencing other columns). This column should generate a single value. For listing items avoid using words like Describe, Generate, etc. and instead use: Identify one, Extract one, Name one etc. Include the necessary words to avoid data duplication as much as possible.
- column_name2 : prompt2 (type: text) (referencing {{column_name}} if needed)
- column_name3 : prompt3 (type: image) (for image generation)
- column_name4 : prompt4 (type: text)...

SEARCH QUERIES:
- "specific search query 1"
- "specific search query 2"

Only include columns that are directly relevant to the request. Create exactly {maxSearchQueries} specific search queries that will help gather initial information. Limit the number of columns to maximum 3 unless strictly required or the user specifies.

ALWAYS include a prompt for each column.
`.trim();

export const NO_SEARCH_PROMPT_TEMPLATE = `
Given this request:

{instruction}

First, provide a short, descriptive name for this dataset (2-5 words).

Then, identify the main columns needed for this dataset.

For image columns, specify the type as "image" and provide a descriptive prompt for image generation.

IMPORTANT: Do not reference image columns in the prompts for other columns.

Only propose an image column if the user request clearly asks for images, illustrations, photos, or visual content.

Your response must follow this exact format:

DATASET NAME:
Short Descriptive Name

COLUMNS:
- column_name1 : prompt1 (type: text) (this first column is always the main object and the only one not referencing other columns). This column should generate a single value. For listing items avoid using words like Describe, Generate, etc. and instead use: Identify one, Extract one, Name one etc. Include the necessary words to avoid data duplication as much as possible.
- column_name2 : prompt2 (type: text) (referencing {{column_name}} if needed)
- column_name3 : prompt3 (type: image) (for image generation)
- column_name4 : prompt4 (type: text)...

Only include columns that are directly relevant to the request.
Limit the number of columns to maximum 3 unless strictly required or the user specifies.
`.trim();
