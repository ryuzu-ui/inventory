# chatbot_standalone.py
import json
import re
import os
from deep_translator import GoogleTranslator
from sentence_transformers import SentenceTransformer, util
from rapidfuzz import fuzz

# ---------- LOAD MODELS (once) ----------
model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

# ---------- HELPERS ----------
def clean(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"(.)\1{2,}", r"\1", text)  # remove repeated letters
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def is_english(text: str) -> bool:
    tag_words = ["ang", "ng", "sa", "sino", "paano", "pwede", "bakit", "kailan"]
    return not any(w in text.lower() for w in tag_words)

def translate_to_english(text: str) -> str:
    try:
        return GoogleTranslator(source="auto", target="en").translate(text)
    except:
        return text

# ---------- FAQ PATH ----------
import sys

if getattr(sys, "frozen", False):
	BASE_DIR = os.path.dirname(sys.executable)  # location of exe
else:
	BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FAQ_PATH = os.path.join(BASE_DIR, "faq.json")

# ---------- LOAD FAQ ----------
def load_faq():
	with open(FAQ_PATH, "r", encoding="utf-8") as f:
		faqs = json.load(f)
	questions = [faq["question"] for faq in faqs]
	question_embeddings = model.encode(questions, convert_to_tensor=True)
	return faqs, question_embeddings

# ---------- LOAD FAQ ONCE ----------
faqs, question_embeddings = load_faq()

# ---------- FUZZY MATCHING ----------
def fuzzy_match(user_input):
    best_score = 0
    best_index = -1

    for i, faq in enumerate(faqs):
        score = fuzz.ratio(user_input, faq["question"])

        if score > best_score:
            best_score = score
            best_index = i

    return best_score, best_index

# ---------- CHATBOT FUNCTION ----------
def reply(user_input: str) -> str:
    if not user_input or len(user_input.split()) < 3:
        return "How can I help you with requisition?"

    user_is_english = is_english(user_input)
    clean_input = clean(user_input)

    # ---------- FUZZY MATCH ----------
    fuzzy_score, fuzzy_index = fuzzy_match(clean_input)

    if fuzzy_score >= 75:
        return faqs[fuzzy_index]["answer"]

    # ---------- TRANSLATE ----------
    translated = translate_to_english(clean_input)

    # ---------- EMBEDDING SEARCH ----------
    user_embedding = model.encode(translated, convert_to_tensor=True)
    scores = util.cos_sim(user_embedding, question_embeddings)[0]

    best_score = float(scores.max())
    best_index = int(scores.argmax())

    if best_score >= 0.30:
        return faqs[best_index]["answer"]

    return (
        "Sorry, I can only answer questions related to equipment requisition based on the FAQ."
        if user_is_english
        else "Pasensya na, ang kaya ko lang sagutin ay tungkol sa equipment requisition base sa aming FAQ."
    )

# ---------- SIMPLE CONSOLE LOOP ----------
if __name__ == "__main__":
    print("Chatbot ready. Type 'exit' to quit.")
    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            break
        response = reply(user_input)
        print("Bot:", response)