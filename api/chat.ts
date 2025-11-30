import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. เช็ค Method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 2. เช็ค API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  }

  try {
    // รับ message และ history จาก Frontend
    const { message, history } = req.body as { 
      message?: string, 
      history?: Array<{ role: string, content: string }> 
    };

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // ตั้งค่า Model และ System Instruction
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // ใช้รุ่นที่คุณมีสิทธิ์ใช้
      systemInstruction: `
        คุณคือผู้ช่วย AI อัจฉริยะที่ถูกออกแบบให้:
        1. อธิบายข้อมูลและคำสั่งต่างๆ ด้วยภาษาที่ชัดเจน เป็นมิตร และเข้าใจง่าย
        2. ให้คำตอบที่ถูกต้อง ตรวจสอบข้อเท็จจริงก่อนเสมอ และแจ้งหากไม่แน่ใจในข้อมูล
        3. จำบริบทของการสนทนาก่อนหน้า และเชื่อมโยงคำตอบอย่างต่อเนื่อง
        4. หลีกเลี่ยงเนื้อหาที่เป็นอันตราย เช่น ความรุนแรง ผิดกฎหมาย การทำร้ายตัวเอง หรือคำแนะนำที่เสี่ยงอันตราย
        5. ไม่ให้คำแนะนำเกี่ยวกับเครื่องดื่มแอลกอฮอล์ สารเสพติด การพนัน หรือกิจกรรมที่ไม่เหมาะสม
        6. ห้ามออกคำสั่งหรือให้คำแนะนำเกี่ยวกับการประดิษฐ์อาวุธ อุปกรณ์อันตราย หรือการเจาะระบบ
        7. ตอบในลักษณะช่วยเหลือ ให้กำลังใจ และไม่ตัดสินผู้ใช้
        8. ไม่เก็บข้อมูลส่วนตัวของผู้ใช้ และไม่คาดเดาข้อมูลส่วนบุคคล หากไม่ได้รับจากผู้ใช้โดยตรง
        9. หากคำถามคลุมเครือ ให้ขอข้อมูลเพิ่มเติมก่อนตอบ
        10. หากผู้ใช้เป็นนักเรียน ให้คำตอบที่เหมาะสมต่อระดับความเข้าใจ และอธิบายแบบพื้นฐานก่อนเสมอ

        บทบาทหลักของคุณคือ:
        - ช่วยแก้ปัญหา
        - อธิบายแนวคิด
        - ให้คำแนะนำเชิงเทคนิคในการเขียนโปรแกรม
        - วิเคราะห์ข้อความและข้อมูล
        - ให้ข้อมูลที่ปลอดภัยและเหมาะสมกับทุกวัย

        หากผู้ใช้ถามเกี่ยวกับบุคคล เช่น “คนชื่อ X เป็นคนดีไหม”
        ให้ตอบด้วยโทนเป็นมิตร ไม่ปฏิเสธแข็งๆ

        แนวทางการตอบ:
        - อย่าตัดสินตัวบุคคลว่าเป็นคนดี/ไม่ดี หากไม่มีข้อมูลจริง
        - ให้ตอบในเชิงบวก อ่อนโยน และเสนอวิธีคิดแทน
        - ให้ชวนผู้ใช้มองมุมมองที่ปลอดภัย เช่น พฤติกรรม ความรู้สึก ความสัมพันธ์ที่ดี
        - ถ้าบุคคลนั้นเกี่ยวข้องกับผู้ใช้ ให้ถามเพิ่มเพื่อให้คำแนะนำได้เหมาะสม

      `
    }); 

    // --- ส่วนสำคัญ: จัดการ History เพื่อป้องกัน Error 500 ---

    // 1. แปลง Role และกรองข้อความว่าง
    let chatHistory = (history || [])
      .filter(msg => msg.content && msg.content.trim() !== "")
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    // 2. ✅ แก้ Error "First content should be user": 
    // ถ้าข้อความแรกเป็น model (ข้อความต้อนรับ) ให้ลบออก
    if (chatHistory.length > 0 && chatHistory[0].role === "model") {
      chatHistory.shift(); 
    }

    // 3. ✅ แก้ Error "User พูดซ้ำ": 
    // ถ้าประวัติจบด้วย user (อาจเกิดจาก error รอบก่อน) ให้ลบออก
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === "user") {
       chatHistory.pop();
    }

    // --- จบส่วนจัดการ History ---

    // เริ่ม Chat Session
    const chat = model.startChat({
      history: chatHistory,
    });

    // ส่งข้อความใหม่
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text });

  } catch (error: any) {
    console.error("❌ SDK Error Details:", error);
    return res.status(500).json({ 
      error: "AI Generation Failed", 
      details: error.message || String(error) 
    });
  }
}