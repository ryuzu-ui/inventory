const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");

// GET USERS
router.get("/", async (req, res) => {
	const { data, error } = await supabase
		.from("users")
		.select("*");

	if (error) return res.status(500).json({ error: error.message });

	res.json(data);
});

// UPDATE ROLE
router.patch("/:id/role", async (req, res) => {
	const { id } = req.params;
	const { role_id } = req.body;

	const { data, error } = await supabase
		.from("users")
		.update({ role_id })
		.eq("id", id);

	if (error) return res.status(500).json({ error: error.message });

	res.json(data);
});

// DELETE USER
router.delete("/:id", async (req, res) => {
	const { id } = req.params;

	const { error } = await supabase
		.from("users")
		.delete()
		.eq("id", id);

	if (error) return res.status(500).json({ error: error.message });

	res.json({ success: true });
});

module.exports = router;