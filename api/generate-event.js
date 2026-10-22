import { allowRequest, apiError, getModel, getOpenAI, json, outputJSON, readJSON, safetyIdentifier } from "../lib/openai.js";

const levels = [
  "轻轻观察与回想，不要求处理物品",
  "接触一件熟悉的小物或日常角落",
  "记录一个具体习惯或共同片段",
  "用文字、声音或图像表达想说的话",
  "完成一件温和的纪念或分享行动",
  "进行可撤回、不过度刺激的象征性整理",
  "由主人自主选择告别方式并照顾此刻的自己"
];

export default {
  async fetch(request) {
    try {
      if (!allowRequest(request, "event", 12)) return json({ error: "请求较多，请稍后再试" }, 429);
      const body = await readJSON(request);
      const step = Math.max(1, Math.min(7, Number(body.step) || 1));
      const stories = Array.isArray(body.stories) ? body.stories.slice(0, 12) : [];
      const completedEvents = Array.isArray(body.completedEvents) ? body.completedEvents.slice(0, 7) : [];
      const excludedEvents = Array.isArray(body.excludedEvents) ? body.excludedEvents.slice(0, 10) : [];
      const client = getOpenAI();
      const response = await client.responses.create({
        model: getModel(),
        store: false,
        safety_identifier: safetyIdentifier(request),
        input: [
          {
            role: "developer",
            content: [{
              type: "input_text",
              text: `你为失去宠物的人设计一件温柔、具体、可完成的告别小事。当前是第 ${step}/7 阶段：${levels[step - 1]}。事件必须比下一阶段更轻，尊重用户节奏，不要求丢弃重要物品，不冒充逝去的宠物说话，不给医疗诊断，不鼓励危险、公开隐私或接触陌生人。必须结合故事中的真实细节；故事不足时使用普适但不编造事实的事件。避免与已完成或已排除事件重复。short 适合两行卡片摘要，body 给出清晰说明，after 告诉用户完成后可以记录什么。`
            }]
          },
          {
            role: "user",
            content: [{
              type: "input_text",
              text: JSON.stringify({ step, stories, completedEvents, excludedEvents, replacement: Boolean(body.replacement) })
            }]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "farewell_event",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["title", "short", "body", "after"],
              properties: {
                title: { type: "string" },
                short: { type: "string" },
                body: { type: "string" },
                after: { type: "string" }
              }
            }
          }
        },
        max_output_tokens: 700
      });
      return json({ task: outputJSON(response) });
    } catch (error) { return apiError(error); }
  }
};
