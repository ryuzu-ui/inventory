from flask import Flask, request, jsonify
from flask_cors import CORS
from apii import reply, reload_faq
import json
import os

app = Flask(__name__)

cors_origins = os.environ.get("CORS_ORIGINS", "").strip()
if cors_origins:
	CORS(app, origins=[o.strip() for o in cors_origins.split(",") if o.strip()])
else:
	CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FAQ_FILE = os.path.join(BASE_DIR, "faq.json")


@app.route("/chat", methods=["POST"])
def chat():
	data = request.get_json(silent=True) or {}
	message = data.get("message")
	if not isinstance(message, str) or not message.strip():
		return jsonify({"error": "message is required"}), 400

	response = reply(message)

	return jsonify({"reply": response})


@app.route("/faqs", methods=["GET"])
def get_faqs():

	with open(FAQ_FILE, encoding="utf-8") as f:
		faqs = json.load(f)

	return jsonify(faqs)


@app.route("/faqs", methods=["POST"])
def add_faq():

	data = request.get_json(silent=True) or {}
	question = data.get("question")
	answer = data.get("answer")
	if not isinstance(question, str) or not question.strip():
		return jsonify({"error": "question is required"}), 400
	if not isinstance(answer, str) or not answer.strip():
		return jsonify({"error": "answer is required"}), 400

	with open(FAQ_FILE, encoding="utf-8") as f:
		faqs = json.load(f)

	faqs.append({
		"question": question,
		"answer": answer
	})

	with open(FAQ_FILE, "w", encoding="utf-8") as f:
		json.dump(faqs, f, indent=2, ensure_ascii=False)

	reload_faq()

	return jsonify({"message": "FAQ added"})


@app.route("/faqs/<int:index>", methods=["PUT"])
def edit_faq(index):

	data = request.get_json(silent=True) or {}
	question = data.get("question")
	answer = data.get("answer")
	if not isinstance(question, str) or not question.strip():
		return jsonify({"error": "question is required"}), 400
	if not isinstance(answer, str) or not answer.strip():
		return jsonify({"error": "answer is required"}), 400

	with open(FAQ_FILE, encoding="utf-8") as f:
		faqs = json.load(f)

	if index < 0 or index >= len(faqs):
		return jsonify({"error": "FAQ index out of range"}), 404

	faqs[index]["question"] = question
	faqs[index]["answer"] = answer

	with open(FAQ_FILE, "w", encoding="utf-8") as f:
		json.dump(faqs, f, indent=2, ensure_ascii=False)

	reload_faq()

	return jsonify({"message": "FAQ updated"})


@app.route("/faqs/<int:index>", methods=["DELETE"])
def delete_faq(index):

	with open(FAQ_FILE, encoding="utf-8") as f:
		faqs = json.load(f)

	if index < 0 or index >= len(faqs):
		return jsonify({"error": "FAQ index out of range"}), 404

	faqs.pop(index)

	with open(FAQ_FILE, "w", encoding="utf-8") as f:
		json.dump(faqs, f, indent=2, ensure_ascii=False)

	reload_faq()

	return jsonify({"message": "FAQ deleted"})


if __name__ == "__main__":
	port = int(os.environ.get("PORT", "5001"))
	app.run(host="0.0.0.0", port=port)