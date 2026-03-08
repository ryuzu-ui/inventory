from flask import Flask, request, jsonify
from flask_cors import CORS
from apii import reply

app = Flask(__name__)
CORS(app)

@app.route("/chat", methods=["POST"])
def chat():
	data = request.json
	message = data["message"]

	response = reply(message)

	return jsonify({
		"reply": response
	})

if __name__ == "__main__":
	app.run(port=5000)