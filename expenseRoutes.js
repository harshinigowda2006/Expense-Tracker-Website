const express = require("express");
const router = express.Router();

const Expense = require("../models/Expense");
const authMiddleware = require("../middleware/authMiddleware");

// Protect every route below with login authentication
router.use(authMiddleware);

// GET: Fetch only the logged-in student's transactions
router.get("/", async (req, res) => {
    try {
        const expenses = await Expense.find({
            user: req.user._id
        }).sort({ createdAt: -1 });

        res.status(200).json(expenses);

    } catch (error) {
        console.error("GET ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch transactions."
        });
    }
});

// POST: Add a transaction for the logged-in student
router.post("/", async (req, res) => {
    try {
        const { title, amount, category, type, date } = req.body;

        const newExpense = new Expense({
            title,
            amount,
            category,
            type,
            date,
            user: req.user._id
        });

        const savedExpense = await newExpense.save();

        res.status(201).json(savedExpense);

    } catch (error) {
        console.error("POST ERROR:", error);

        res.status(400).json({
            message: "Failed to add transaction."
        });
    }
});

// PUT: Update only the logged-in student's transaction
router.put("/:id", async (req, res) => {
    try {
        const { title, amount, category, type, date } = req.body;

        const updatedExpense = await Expense.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id
            },
            { title, amount, category, type, date },
            { new: true, runValidators: true }
        );

        if (!updatedExpense) {
            return res.status(404).json({
                message: "Transaction not found."
            });
        }

        res.status(200).json(updatedExpense);

    } catch (error) {
        console.error("PUT ERROR:", error);

        res.status(400).json({
            message: "Failed to update transaction."
        });
    }
});

// DELETE: Delete only the logged-in student's transaction
router.delete("/:id", async (req, res) => {
    try {
        const deletedExpense = await Expense.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!deletedExpense) {
            return res.status(404).json({
                message: "Transaction not found."
            });
        }

        res.status(200).json({
            message: "Transaction deleted successfully!"
        });

    } catch (error) {
        console.error("DELETE ERROR:", error);

        res.status(400).json({
            message: "Failed to delete transaction."
        });
    }
});

module.exports = router;