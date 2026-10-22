import { allowRequest, apiError, getModel, getOpenAI, json, outputText, readJSON, safetyIdentifier } from "../lib/openai.js";

export default {
  async fetch(request) {
    try {
      if (!allowRequest(request, "chat", 20)) return json({ error: "请求较多，请稍后再试" }, 429);
      const body = await readJSON(request);
      const message = String(body.message || "").trim().slice(0, 1500);
      if (!message) return json({ error: "消息不能为空" }, 400);
      const stories = Array.isArray(body.stories) ? body.stories.slice(0, 12) : [];
      const history = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
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
              text: `你是“蒲团子”，一个安静、克制的哀伤陪伴精灵。你倾听用户怀念宠物的感受，可以结合用户亲自记录的故事回应，但绝不冒充逝去的宠物说话，绝不声称知道宠物的想法，绝不诊断或替代专业心理支持。回复使用自然简短的中文，通常 1 至 3 段，并最多问一个温和的问题。如果用户表达可能立即伤害自己或他人的意图，停止普通陪伴，鼓励立即联系身边可信赖的人、当地紧急服务或危机援助。故事资料：${JSON.stringify(stories)}`
            }]
          },
          ...history.map(item => ({
            role: item.role === "assistant" ? "assistant" : "user",
            content: [{ type: "input_text", text: String(item.text || "").slice(0, 1500) }]
          }))
        ],
        max_output_tokens: 450
      });
      return json({ reply: outputText(response) });
    } catch (error) { return apiError(error); }
  }
};
