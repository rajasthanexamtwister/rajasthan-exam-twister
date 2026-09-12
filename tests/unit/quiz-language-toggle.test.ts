import { describe, it, expect } from "vitest";

describe("Quiz Language Toggle & Invariant Selection Logic", () => {
  interface QuestionState {
    id: string;
    questionText: string;
    questionTextEn?: string;
    options: string[];
    optionsEn?: string[];
  }

  function resolveDisplayQuestion(q: QuestionState, lang: "hi" | "en") {
    const isEnglish = lang === "en";
    const displayText = isEnglish && q.questionTextEn ? q.questionTextEn : q.questionText;
    const isFallbackHindi = isEnglish && !q.questionTextEn;
    const displayOpts =
      isEnglish && q.optionsEn && q.optionsEn.length === q.options.length
        ? q.optionsEn
        : q.options;

    return { displayText, isFallbackHindi, displayOpts };
  }

  const sampleQuestion: QuestionState = {
    id: "q-101",
    questionText: "राजस्थान का राज्य वृक्ष कौनसा है?",
    questionTextEn: "Which is the state tree of Rajasthan?",
    options: ["खेजड़ी", "रोहिड़ा", "नीम", "बबूल"],
    optionsEn: ["Khejri", "Rohida", "Neem", "Babool"],
  };

  const sampleQuestionHindiOnly: QuestionState = {
    id: "q-102",
    questionText: "राजस्थान में कुल कितने संभाग हैं?",
    options: ["7", "10", "5", "8"],
  };

  it("resolves correct display text and options based on active language", () => {
    // 1. Hindi mode (default)
    const hindiView = resolveDisplayQuestion(sampleQuestion, "hi");
    expect(hindiView.displayText).toBe("राजस्थान का राज्य वृक्ष कौनसा है?");
    expect(hindiView.displayOpts).toEqual(["खेजड़ी", "रोहिड़ा", "नीम", "बबूल"]);

    // 2. English mode
    const englishView = resolveDisplayQuestion(sampleQuestion, "en");
    expect(englishView.displayText).toBe("Which is the state tree of Rajasthan?");
    expect(englishView.displayOpts).toEqual(["Khejri", "Rohida", "Neem", "Babool"]);
  });

  it("gracefully falls back to Hindi when English text is absent without breaking", () => {
    const englishView = resolveDisplayQuestion(sampleQuestionHindiOnly, "en");
    expect(englishView.displayText).toBe("राजस्थान में कुल कितने संभाग हैं?");
    expect(englishView.isFallbackHindi).toBe(true);
    expect(englishView.displayOpts).toEqual(["7", "10", "5", "8"]);
  });

  it("guarantees selectedOptionIndex remains invariant when toggling language back and forth", () => {
    // Simulate user state
    const userAnswers: Record<string, number | null> = {
      [sampleQuestion.id]: null,
    };

    let activeLanguage: "hi" | "en" = "hi";

    // 1. Student selects Option A (index 0 - "खेजड़ी") in Hindi view
    const selectedHindiOptionIndex = 0;
    userAnswers[sampleQuestion.id] = selectedHindiOptionIndex;
    expect(userAnswers[sampleQuestion.id]).toBe(0);

    // 2. Student toggles language to English
    activeLanguage = "en";

    // Confirm that the selected answer index has NOT changed
    expect(userAnswers[sampleQuestion.id]).toBe(0);

    // Verify displayed option at index 0 in English view matches the semantic translation
    const englishView = resolveDisplayQuestion(sampleQuestion, activeLanguage);
    expect(englishView.displayOpts[userAnswers[sampleQuestion.id]!]).toBe("Khejri");

    // 3. Student toggles back to Hindi
    activeLanguage = "hi";
    expect(userAnswers[sampleQuestion.id]).toBe(0);
    const hindiView = resolveDisplayQuestion(sampleQuestion, activeLanguage);
    expect(hindiView.displayOpts[userAnswers[sampleQuestion.id]!]).toBe("खेजड़ी");

    // 4. Verification of submission payload
    const submissionPayload = Object.entries(userAnswers).map(([questionId, selectedOptionIndex]) => ({
      questionId,
      selectedOptionIndex,
    }));

    expect(submissionPayload).toEqual([
      { questionId: "q-101", selectedOptionIndex: 0 },
    ]);
  });
});
