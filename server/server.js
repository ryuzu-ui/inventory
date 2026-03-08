const express = require("express")
const cors = require("cors")
const stringSimilarity = require("string-similarity")
const faqs = require("./faq.json")

const app = express()
app.use(cors())
app.use(express.json())

// VERY SIMPLE TAGALOG DETECTOR
function isTagalog(text) {
	const tagalogWords = [
		"paano", "pano", "ano", "saan", "kailan", "bakit",
		"mag", "ba", "ang", "ng", "sa", "ako", "ikaw"
	]
	return tagalogWords.some(word => text.includes(word))
}

// LIGHT NORMALIZATION (AI-ISH)
function normalize(text) {
	return text
		.toLowerCase()
		.replace(/[^\w\s]/g, "")
		.replace("pano", "paano")
		.replace("regster", "register")
		.replace("reseration", "reservation")
}

// IMPLICIT TRANSLATION VIA FAQ SPACE
function matchFAQ(message) {
	const questions = faqs.map(f => f.question.toLowerCase())
	return stringSimilarity.findBestMatch(message, questions)
}

app.post("/chat", (req, res) => {
	let message = normalize(req.body.message)

	// Detect language (for logic / logging)
	const language = isTagalog(message) ? "tagalog" : "english"

	const match = matchFAQ(message)
	const score = match.bestMatch.rating
	const index = match.bestMatchIndex

	if (score > 0.75) {
		return res.json({
			reply: faqs[index].answer,
			confidence: score,
			lang: language
		})
	}

	if (score > 0.5) {
		return res.json({
			reply: `Did you mean: "${faqs[index].question}"?`,
			confidence: score,
			lang: language
		})
	}

	res.json({
		reply: "Pasensya na, hindi ko pa alam ang sagot diyan.",
		confidence: score,
		lang: language
	})
})

app.listen(5000, () => {
	console.log("AI chatbot running at http://localhost:5000")
})