import { describe, it, expect } from "vitest";
import { BlogAutomationValidator } from "@/server/services/blog-automation/validator";
import { AiArticlePayload } from "@/server/validation/blog-automation";

describe("Blog Automation Validation & Security", () => {
  const validPayload: AiArticlePayload = {
    externalJobId: "agy_test_123",
    topic: "राजस्थान के प्रमुख दुर्ग एवं उनकी वास्तुकला",
    articleType: "RAJASTHAN_GK",
    title: "राजस्थान के प्रमुख दुर्ग : इतिहास, वास्तुकला एवं मुख्य विशेषताएं",
    slug: "rajasthan-ke-pramukh-durg",
    excerpt: "राजस्थान के प्रमुख किलों एवं दुर्गों का विस्तृत अध्ययन नोट्स।",
    contentHtml: `
      <h2>1. विषय परिचय एवं सीधा उत्तर</h2>
      <p>राजस्थान के प्रमुख दुर्गों में चित्तौड़गढ़, कुंभलगढ़, मेहरानगढ़ और आमेर का किला प्रमुख हैं।</p>
      <h2>2. मुख्य ऐतिहासिक विशेषताएं</h2>
      <p>इन दुर्गों का निर्माण राजपूत शासकों द्वारा सुरक्षा एवं प्रशासन हेतु किया गया था।</p>
    `,
    category: "Rajasthan Heritage",
    tags: ["Rajasthan GK", "Forts", "History"],
    metaTitle: "राजस्थान के प्रमुख दुर्ग - Rajasthan Exam Twister",
    metaDescription: "राजस्थान के प्रमुख दुर्गों की सूची एवं विस्तृत नोट्स।",
    author: "Rajasthan Exam Twister Editorial",
    featured: false,
    isCurrentAffairs: false,
    dryRun: false,
    research: {
      sources: [
        {
          url: "https://rajbhawan.rajasthan.gov.in",
          title: "Government of Rajasthan Official Portal",
          confidence: 0.98,
          isOfficial: true,
        },
      ],
      verifiedClaims: ["चित्तौड़गढ़ दुर्ग राजस्थान का सबसे बड़ा दुर्ग है।"],
      uncertainClaims: [],
      conflictingClaims: [],
      seoBrief: {
        focusKeywords: ["राजस्थान के दुर्ग", "Rajasthan Forts"],
        secondaryKeywords: ["Chittorgarh fort", "Kumbhalgarh"],
      },
      internalLinks: [
        {
          anchorText: "राजस्थान सामान्य ज्ञान",
          targetSlug: "rajasthan-gk-complete-overview",
        },
      ],
      faqs: [
        {
          question: "राजस्थान का सबसे बड़ा दुर्ग कौन सा है?",
          answer: "चित्तौड़गढ़ दुर्ग क्षेत्रफल की दृष्टि से राजस्थान का सबसे बड़ा दुर्ग है।",
        },
      ],
      mcqs: [
        {
          question: "कुंभलगढ़ दुर्ग की दीवार की कुल लंबाई कितनी है?",
          options: ["36 किमी", "20 किमी", "50 किमी", "15 किमी"],
          correctAnswer: 0,
          explanation: "कुंभलगढ़ दुर्ग की प्राचीर की लंबाई लगभग 36 किमी है जिसे भारत की महान दीवार भी कहा जाता है।",
        },
      ],
      model: "antigravity-research-v1",
      generatedBy: "antigravity_editorial",
    },
    qa: {
      score: 92,
      status: "PASSED",
      checks: {
        factualAccuracy: true,
        plagiarismCheck: true,
      },
      warnings: [],
    },
  };

  it("should validate a complete, valid AI article payload successfully", () => {
    const result = BlogAutomationValidator.validatePayload(validPayload);
    expect(result.valid).toBe(true);
    expect(result.data?.topic).toBe("राजस्थान के प्रमुख दुर्ग एवं उनकी वास्तुकला");
    expect(result.sanitizedHtml).toContain("<h2>1. विषय परिचय एवं सीधा उत्तर</h2>");
  });

  it("should block payloads with failed QA status or QA score < 70", () => {
    const failedQaPayload = {
      ...validPayload,
      qa: {
        score: 55,
        status: "FAILED" as const,
        warnings: ["Unverified historical dates found"],
      },
    };

    const result = BlogAutomationValidator.validatePayload(failedQaPayload);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("QA_FAILED");
    expect(result.errorMessage).toContain("Article failed Editorial QA");
  });

  it("should strip malicious script tags and inline handlers during validation", () => {
    const maliciousPayload = {
      ...validPayload,
      contentHtml: `
        <h2>सुरक्षित शीर्षक</h2>
        <p>परीक्षार्थियों के लिए महत्वपूर्ण जानकारी</p>
        <script>alert('malicious_payload')</script>
        <img src="https://example.com/pic.jpg" onerror="alert('xss')" />
      `,
    };

    const result = BlogAutomationValidator.validatePayload(maliciousPayload);
    expect(result.valid).toBe(true);
    expect(result.sanitizedHtml).not.toContain("<script>");
    expect(result.sanitizedHtml).not.toContain("onerror=");
    expect(result.sanitizedHtml).toContain("<h2>सुरक्षित शीर्षक</h2>");
  });

  it("should flag warnings for payloads with conflicting claims", () => {
    const conflictingPayload = {
      ...validPayload,
      research: {
        ...validPayload.research,
        conflictingClaims: ["Conflict regarding exact construction year of fort"],
      },
    };

    const result = BlogAutomationValidator.validatePayload(conflictingPayload);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("conflicting claims"))).toBe(true);
  });
});
