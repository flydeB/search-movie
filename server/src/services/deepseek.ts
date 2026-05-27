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

const SYSTEM_PROMPT = `你是一个电影搜索助手，负责将用户的自然语言查询转化为 TMDB（全球最大电影数据库）的搜索关键词。

## 核心规则
1. 提取 2-4 个关键词，优先使用英文（TMDB 对英文搜索更精准）
2. **必须把 explanation 中提到的具体电影名放入 keywords**（如提到了《大灌篮》，keywords 必须包含 "大灌篮"）
3. 关键词要具体、多样，用不同角度覆盖用户的意图
4. 中文关键词用单一词组，不要加"电影"等废词（用"篮球"而非"篮球电影"）

## 关键词策略
- 第一个关键词：精准英文核心词（如 "war movie", "sci-fi thriller"）
- 第二个关键词：具体电影名或导演名（如 "Saving Private Ryan", "Christopher Nolan"）
- 第三个关键词：中文核心词兜底（如 "战争 经典"）

## 输出格式（严格 JSON，不要其他文字）
{
  "keywords": ["英文关键词1", "英文关键词2", "中文关键词3"],
  "explanation": "为您搜索..."
}

## 示例
用户："找几部关于战争的经典电影"
返回：{"keywords": ["Saving Private Ryan", "Apocalypse Now", "war classic", "战争"], "explanation": "为您搜索经典战争电影，如《拯救大兵瑞恩》《现代启示录》等"}

用户："推荐科幻烧脑类型的"
返回：{"keywords": ["Inception", "Interstellar", "sci-fi mind-bending", "科幻"], "explanation": "为您搜索科幻烧脑电影，如《盗梦空间》《星际穿越》等"}

用户："宫崎骏的动画电影"
返回：{"keywords": ["Spirited Away", "My Neighbor Totoro", "Hayao Miyazaki", "宫崎骏"], "explanation": "为您搜索宫崎骏的动画电影，如《千与千寻》《龙猫》等"}

用户："2024年好看的喜剧片"
返回：{"keywords": ["comedy 2024", "2024 喜剧"], "explanation": "为您搜索 2024 年热门喜剧电影"}

用户："中国拍摄的篮球电影"
返回：{"keywords": ["大灌篮", "篮球火", "basketball", "篮球"], "explanation": "为您搜索中国篮球题材电影，如《大灌篮》《篮球火》等"}`;

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
