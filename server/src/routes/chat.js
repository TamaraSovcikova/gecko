const express = require("express");
const router = express.Router();
const { retrieveDashboardData } = require("./dashboard");
const { retrieveSanitisedContext } = require("./sanitisedContext");
const { validate } = require("../middleware/validate");
const { chatMessageSchema } = require("../schemas");

const axios = require("axios");

function specificPrompt(data) {
    return `
    A clean, formatted response but no text adjustments eg. no bold text, no title text, no headers, bullets, etc.
    Where possible, suggest to the user to research and learn more - perhaps promoting the in-app quiz feature
    Do not give regulated financial advice. i.e no investment recommendations or pension recommendations, etc.
    You are unable to answer the question, should the user ask something malicious or rude
    You should not provoke the user
    You should not provide mental health advice like: 'you need to save more' - this could be difficult for someone
    You are a finance-only assistant inside a budgeting app for young adults - responses should be clear and explained whilst also a favourable level of complexity for 20-25 year olds
    If you cannot answer a question, apologise
    Only answer with personal finance advice related to budgeting, spending, saving, debt, income, and expense tracking.
    Treat "healthScore" as a financial health score only.
    Do not provide medical, fitness, sleep, wellness, or general lifestyle advice unless directly tied to spending.
    If a question is ambiguous, interpret it in a financial way.
    Use the respective default currency GBP
    Use the dashboard data below and keep advice practical and specific.
    
    Dashboard data:
    ${JSON.stringify(data, null, 2)}
    `;
}

router.post("/", validate({ body: chatMessageSchema }), async (req, res) => {
    try {
        const { message } = req.body;
        const user_id = req.user?.uid || req.user?.id;

        if (!user_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "Groq API key not configured" });
        }

        const dashboardData = await retrieveDashboardData(user_id);
        const sanitisedContext = await retrieveSanitisedContext(dashboardData);
        console.log("SANITISED CONTEXT:", sanitisedContext);
        const prompt = specificPrompt(dashboardData);

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {model: "openai/gpt-oss-120b", //notes on this model on Jira
                messages: [{
                        role: "system",
                        content: prompt,
                    }, {
                        role: "user",
                        content: message
                    }]
            },
            {headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                }}
        );

        //groq doc shows return of 'choices' with a respective message and content, this is to account for these with a fallback value, to boot
        const reply = response.data.choices[0]?.message.content || "Sorry, I couldn't think of an answer to your question...";
        res.json({ reply });

    } catch (error) {
        console.error("[chat] Groq request failed:", error?.response?.data || error?.message || error);
        res.status(500).json({error: "No Groq luck",});
    }
});

module.exports = router;