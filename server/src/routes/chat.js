const express = require("express");
const router = express.Router();

const axios = require("axios");

router.post("/", async (req, res) => {
    try {
        const { message } = req.body;
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {model: "openai/gpt-oss-120b", //notes on this model on Jira
                messages: [{
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
        res.status(500).json({error: "No Groq luck",});
    }
});

module.exports = router;