import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getDefaultQuestions } from "@/data/venue-settings";
import type { CustomQuestion, QuestionType, RatingStyle } from "@/types/venue";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SYSTEM_PROMPT = `You are an expert at designing feedback questions for hospitality (restaurants, hotels). Suggest 5-8 short questions that capture: emotion (service feeling), aspects (cleanliness, food/room, value), positive priming (what they liked), and optional yes/no (e.g. would recommend). Output ONLY a JSON array of objects with "title" (string), "key" (slug: overall, cleanliness, service, foodQuality, roomQuality, value, what_liked, would_recommend, optionalText, or custom slug), and "type" (one of: "emoji", "yesNo", "text"). Use "emoji" for rating-style, "yesNo" for recommend/return, "text" for open answers. Example: [{"title":"How did our service make you feel?","key":"service","type":"emoji"},{"title":"Would you recommend us?","key":"would_recommend","type":"yesNo"}]`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;
  if (!venueId) return NextResponse.json({ error: "venueId required" }, { status: 400 });
  const tenantId = request.headers.get("x-tenant-id");
  const { getVenueForTenant } = await import("@/data/tenants");
  if (!tenantId || !getVenueForTenant(tenantId, venueId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { reviewHistoryText?: string; venueType?: string; customerContext?: string; defaultRatingStyle?: RatingStyle };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const reviewHistoryText = body.reviewHistoryText?.trim() || "";
  const venueType = body.venueType || "restaurant";
  const customerContext = body.customerContext?.trim() || "";
  const defaultRatingStyle: RatingStyle = body.defaultRatingStyle === "emoji" ? "emoji" : "star";

  if (!openai) {
    const defaults = getDefaultQuestions();
    return NextResponse.json({
      questions: defaults.map((q, i) => ({
        ...q,
        order: i,
        ratingStyle: q.type === "emoji" ? defaultRatingStyle : undefined,
      })),
      message: "OpenAI not configured; using default questions.",
    });
  }

  try {
    let userContent = `Venue type: ${venueType}.`;
    if (reviewHistoryText) userContent += ` Sample Google reviews:\n\n${reviewHistoryText.slice(0, 4000)}`;
    if (customerContext) userContent += `\n\nCustomer context (e.g. current order): ${customerContext}. You can suggest questions like "Did you enjoy the [item]?" for ordered items.`;
    userContent += "\n\nSuggest feedback questions as a JSON array with title, key, and type.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "[]";
    const parsed = safeParseQuestions(raw);
    const questions: CustomQuestion[] = parsed.map((q, i) => ({
      id: (q.key || "q") + "-" + i,
      title: q.title || "",
      type: validType(q.type),
      key: q.key || "overall",
      order: i,
      ratingStyle: validType(q.type) === "emoji" ? defaultRatingStyle : undefined,
      placeholder: q.type === "text" ? "Your answer..." : undefined,
      yesNoLabels: q.type === "yesNo" ? ["Yes", "No"] : undefined,
    }));
    return NextResponse.json({ questions });
  } catch (e) {
    console.error(e);
    const defaults = getDefaultQuestions();
    return NextResponse.json({
      questions: defaults.map((q, i) => ({
        ...q,
        order: i,
        ratingStyle: q.type === "emoji" ? defaultRatingStyle : undefined,
      })),
      error: "AI suggestion failed; using defaults.",
    });
  }
}

function validType(t: string): QuestionType {
  const types: QuestionType[] = ["emoji", "yesNo", "text"];
  return types.includes(t as QuestionType) ? (t as QuestionType) : "emoji";
}

function safeParseQuestions(raw: string): { title: string; key: string; type: string }[] {
  try {
    const cleaned = raw.replace(/```json?\s*|\s*```/g, "").trim();
    const arr = JSON.parse(cleaned);
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, 12).map((item: { title?: string; key?: string; type?: string }) => ({
      title: typeof item?.title === "string" ? item.title : "",
      key: typeof item?.key === "string" ? item.key : "overall",
      type: typeof item?.type === "string" ? item.type : "emoji",
    }));
  } catch {
    return [];
  }
}
