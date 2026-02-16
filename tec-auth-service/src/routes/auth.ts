import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

// Register Endpoint
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  return res.json({ message: "registered", username, hashed });
});

// Login Endpoint
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // TODO: verify against DB later
  const token = jwt.sign({ username }, process.env.JWT_SECRET as string, {
    expiresIn: "1h",
  });
  return res.json({ token });
});

export default router;
