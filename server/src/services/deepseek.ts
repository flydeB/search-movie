import OpenAI from 'openai';

/** DeepSeek 意图解析结果 */
export interface AIParseResult {
  keywords: string[];
  explanation: string;
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY 未配置，请在 .env 文件中设置');
    }
    client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey,
      timeout: 20000,
      maxRetries: 1,
    });
  }
  return client;
}

const SYSTEM_PROMPT = `你是一个电影搜索助手。用户会用自然语言描述想看的电影，请分析并提取搜索关键词。

返回严格的 JSON 格式（只返回 JSON，不要其他文字）：
{
  "keywords": ["英文关键词1", "中文关键词2"],
  "explanation": "为您搜索..."
}

示例：
用户输入："推荐一部 2024 年上映的、适合情侣看的轻松喜剧电影"
返回：{"keywords": ["2024 comedy romance", "2024 喜剧 爱情"], "explanation": "为您搜索 2024 年轻松喜剧爱情电影"}

用户输入："诺兰导演的烧脑电影"
返回：{"keywords": ["Christopher Nolan mind-bending", "Christopher Nolan"], "explanation": "为您搜索克里斯托弗·诺兰导演的电影"}

用户输入："宫崎骏的动画电影"
返回：{"keywords": ["Hayao Miyazaki anime", "宫崎骏 动画"], "explanation": "为您搜索宫崎骏的动画电影"}`;

/**
 * 调用 DeepSeek 解析用户的自然语言查询，提取搜索关键词
 * @param naturalQuery 用户的自然语言查询
 * @returns 解析结果：关键词数组 + 说明文字
 */
export async function aiExtractKeywords(naturalQuery: string): Promise<AIParseResult> {
  if (!naturalQuery || !naturalQuery.trim()) {
    throw new Error('查询内容不能为空');
  }

  const ai = getClient();

  const completion = await ai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: naturalQuery },
    ],
    temperature: 0.3,
    max_tokens: 300,
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek 返回内容为空');
  }

  // 提取 JSON（AI 可能包含多余内容）
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('DeepSeek 返回格式异常，无法解析 JSON');
  }

  try {
    const result = JSON.parse(jsonMatch[0]) as AIParseResult;

    if (!Array.isArray(result.keywords) || result.keywords.length === 0) {
      throw new Error('DeepSeek 未返回有效关键词');
    }

    return {
      keywords: result.keywords,
      explanation: result.explanation || `为您搜索：${naturalQuery}`,
    };
  } catch (parseError) {
    throw new Error(`解析 AI 返回结果失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
  }
}
