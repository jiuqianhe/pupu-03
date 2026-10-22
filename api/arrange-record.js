import { allowRequest, apiError, getModel, getOpenAI, json, outputJSON, readJSON, safetyIdentifier } from "../lib/openai.js";

export default {
  async fetch(request) {
    try {
      if (!allowRequest(request, "arrange", 10)) return json({ error: "请求较多，请稍后再试" }, 429);
      const body = await readJSON(request);
      const text = String(body.text || "").slice(0, 5000);
      const images = Array.isArray(body.images) ? body.images.filter(value => /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(value)).slice(0, 2) : [];
      const content = [
        {
          type: "input_text",
          text: `事件标题：${String(body.eventTitle || "告别记录").slice(0, 120)}\n用户原文：\n${text || "（用户没有填写文字，请只根据图片做克制描述，不要猜测身份、地点或关系。）"}\n\n请识别图片中可见的内容，整理原文的段落、标点和阅读顺序。保留用户语气与事实，不虚构图片外的信息，不把宠物拟人化发言。arrangedRecord 是可直接展示的纯文本；layoutChoice 只能是 reference、photo-first、text-first。`
        },
        ...images.map(image_url => ({ type: "input_image", image_url, detail: "low" }))
      ];
      const client = getOpenAI();
      const response = await client.responses.create({
        model: getModel(),
        store: false,
        safety_identifier: safetyIdentifier(request),
        input: [{ role: "user", content }],
        text: {
          format: {
            type: "json_schema",
            name: "arranged_memory",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["arrangedRecord", "layoutChoice", "imageCaptions"],
              properties: {
                arrangedRecord: { type: "string" },
                layoutChoice: { type: "string", enum: ["reference", "photo-first", "text-first"] },
                imageCaptions: { type: "array", items: { type: "string" } }
              }
            }
          }
        },
        max_output_tokens: 1100
      });
      return json(outputJSON(response));
    } catch (error) { return apiError(error); }
  }
};
