// ✅ เปลี่ยนเป็น import ให้รองรับ ES Module
import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ อย่าลืมใส่ API Key ของคุณตรงนี้
const apiKey = "AIzaSyCWmw7IFnIBczeGunQRRaX7BVX7aWhAjtU"; 

async function listModels() {
  try {
    console.log("กำลังตรวจสอบ Model ที่ใช้งานได้...");
    
    // ยิง API ไปถาม Google ตรงๆ
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.models) {
      console.log("\n✅ รายชื่อ Model ที่ Key ของคุณใช้ได้:");
      console.log("-----------------------------------------");
      data.models.forEach(m => {
        // กรองเอาเฉพาะตัวที่เจนข้อความได้
        if (m.supportedGenerationMethods.includes("generateContent")) {
            // ตัดคำว่า models/ ออกเพื่อให้ก๊อปไปใช้ได้เลย
            console.log(m.name.replace("models/", ""));
        }
      });
      console.log("-----------------------------------------");
      console.log("ให้เลือกชื่อด้านบน ไปใส่ในไฟล์ api/chat.ts ครับ");
    } else {
      console.error("❌ ไม่พบข้อมูล Model:", data);
    }

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
  }
}

listModels();