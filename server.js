"use strict";

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

require("dotenv").config();
const mongoURL = process.env.MONGO_URI;

const app = express();
app.use(cors());
app.use(bodyParser.json());

//MongoDB


mongoose.connect(mongoURL/*, { useNewUrlParser:true, useUnifiedTopology:true}*/)
    .then(() => console.log("MongoDBに接続成功"))
    .catch(err => console.error("MongoDB接続失敗:",err));

//スキーマとモデルの定義
const expenseSchema = new mongoose.Schema({
    date: {type: Date, default: Date.now },
    type: String,
    amount: Number
});
const Expense = mongoose.model("Expense", expenseSchema);

//データ受け取り・保存
app.post("/", async (req, res) => {
    try {
        const { type, expend} = req.body;
        const newExpense = new Expense({ type, amount: expend});
        await newExpense.save();
        res.send("保存成功");
    } catch (err) {
        console.error("保存エラー：", err);
        res.status(500).send("保存失敗");
    }
});

// データ取得
app.get("/relay", async (req, res) => {
    try {
        const expenses = await Expense.find().sort({date: -1}).limit(100);
        res.json({
            expendDataObjectArray: expenses
        });
    } catch (err) {
        console.error("取得エラー：", err);
        res.status(500).send("取得失敗");
    }
})

// サーバの起動
app.listen(8001, () => {
    console.log("MongoDB対応サーバ稼働中：ポート8001");
});




